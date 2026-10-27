import { initTRPC, TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { ZodError } from "zod";

import { isSessionAdministrator } from "./admin-guard";
import type { Context } from "./context";
import { normalizeProcedureError } from "./errors-normalize";
import { markDataChanged } from "./gamification/computed";
import { captureBefore, isTracked, writeChanges } from "./services/change-log";
import { PUBLIC_COLLECTION_LIMIT } from "./lib/resource-bounds";

// Workers have no NODE_ENV, so tRPC's default would treat production as dev and
// put stack traces in error responses; Vite's build flag decides instead.
const IS_DEV = (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true;

export const t = initTRPC.context<Context>().create({
  isDev: IS_DEV,
  errorFormatter({ shape, error }) {
    const { stack: _stack, ...data } = shape.data;
    return {
      ...shape,
      data: {
        ...(IS_DEV ? shape.data : data),
        zodError:
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
        // Safe to show the owner: 4xx messages are written in procedure code or
        // by normalizeProcedureError; 5xx and validation dumps are never exposed.
        userMessage:
          shape.data.httpStatus < 500 && !(error.cause instanceof ZodError) ? error.message : null,
      },
    };
  },
});

export const router = t.router;

const SLOW_PROCEDURE_MS = 100;
const QUERY_HEAVY_PROCEDURE = 8;

const errorBoundary = t.middleware(async ({ next, path, ctx }) => {
  const startedAt = Date.now();
  const queriesBefore = ctx.d1?.queries ?? 0;
  // next() resolves with { ok: false } instead of throwing when the procedure fails.
  const result = await next();
  const durationMs = Date.now() - startedAt;
  const d1Queries = (ctx.d1?.queries ?? 0) - queriesBefore;

  if (!result.ok) {
    const error = normalizeProcedureError(result.error, path);
    const cause = result.error.cause;
    const details = {
      path,
      requestId: ctx.requestId,
      durationMs,
      d1Queries,
      code: error.code,
      errorName: cause instanceof Error ? cause.name : result.error.name,
    };
    // Client errors (validation, auth, missing rows, conflicts) are expected
    // traffic; only server faults go to error level, where alerts watch.
    if (getHTTPStatusCodeFromError(error) >= 500) console.error("[trpc] procedure failed", details);
    else console.warn("[trpc] procedure rejected", details);
    throw error;
  }

  if (Array.isArray(result.data) && result.data.length === PUBLIC_COLLECTION_LIMIT) {
    console.warn("[resource] collection reached its row cap", {
      path,
      requestId: ctx.requestId,
      limit: PUBLIC_COLLECTION_LIMIT,
    });
  }
  if (durationMs >= SLOW_PROCEDURE_MS || d1Queries >= QUERY_HEAVY_PROCEDURE) {
    console.info("[trpc] costly procedure", { path, requestId: ctx.requestId, durationMs, d1Queries });
  }
  return result;
});

export const publicProcedure = t.procedure.use(errorBoundary);

const requireAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }

  if (!(await isSessionAdministrator(ctx.db, ctx.session))) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Administrator access required",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

// Stored computations (records, club standings) are reused until data changes;
// every successful admin mutation is such a change.
// Uploads and cache purges write no rows, and a failure here must not turn a committed change into an error.
const markComputedStale = t.middleware(async ({ ctx, next, type, path }) => {
  const result = await next();
  if (type === "mutation" && result.ok && !path.startsWith("images.") && path !== "cache.purgePublic") {
    try {
      await markDataChanged(ctx.db);
    } catch (error) {
      console.error("[computed] could not mark results stale", { path, requestId: ctx.requestId, error: String(error) });
    }
  }
  return result;
});

// The history is written after the change, not in its batch: a failure to record is logged and never
// undoes or blocks what the administrator did.
const recordChanges = t.middleware(async ({ ctx, next, type, path, getRawInput }) => {
  if (type !== "mutation" || !isTracked(path)) return next();
  let pending: Awaited<ReturnType<typeof captureBefore>> | undefined;
  let input: unknown;
  try {
    input = await getRawInput();
    pending = await captureBefore(ctx.db, path, input);
  } catch (error) {
    console.error("[change-log] could not read the record before the change", { path, requestId: ctx.requestId, error: String(error) });
  }
  const result = await next();
  if (result.ok && pending) {
    try {
      const user = ctx.session?.user;
      await writeChanges(ctx.db, pending, { actor: user?.name || user?.email || "unknown", path, input, result: result.data });
    } catch (error) {
      console.error("[change-log] could not record the change", { path, requestId: ctx.requestId, error: String(error) });
    }
  }
  return result;
});

export const adminProcedure = t.procedure.use(errorBoundary).use(requireAdmin).use(markComputedStale).use(recordChanges);
