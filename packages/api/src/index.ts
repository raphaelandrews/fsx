import { initTRPC, TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { ZodError } from "zod";
import { and, asc, eq } from "drizzle-orm";

import { isAdministrator, resolveAdminRule } from "@fsx/auth/owner";
import { account, user } from "@fsx/db/schema/auth";
import { env } from "@fsx/env/server";

import type { Context } from "./context";
import { PUBLIC_COLLECTION_LIMIT } from "./resource-bounds";

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

function causeChainText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current !== undefined && current !== null && depth < 5; depth++) {
    if (!(current instanceof Error)) {
      parts.push(String(current));
      break;
    }
    parts.push(current.message);
    current = current.cause;
  }
  return parts.join(" | ");
}

// tRPC turns anything a resolver throws that is not a TRPCError into an
// INTERNAL_SERVER_ERROR whose message is the original one (drizzle includes the
// SQL) and whose cause is the original error. Intentional TRPCErrors pass
// through; database constraint failures become actionable codes; everything
// else gets a generic message so internals never reach the client.
export function normalizeProcedureError(error: TRPCError): TRPCError {
  const unexpected =
    error.code === "INTERNAL_SERVER_ERROR" && error.cause instanceof Error && !(error.cause instanceof TRPCError);
  if (!unexpected) return error;
  const detail = causeChainText(error.cause);
  if (/unique constraint|already exists/i.test(detail)) {
    return new TRPCError({
      code: "CONFLICT",
      message: "The submitted data conflicts with an existing record.",
      cause: error.cause,
    });
  }
  if (/foreign key constraint/i.test(detail)) {
    return new TRPCError({
      code: "CONFLICT",
      message: "This record is still referenced by other data.",
      cause: error.cause,
    });
  }
  if (/check constraint|not null constraint/i.test(detail)) {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: "The submitted data is not valid for this record.",
      cause: error.cause,
    });
  }
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected server error occurred.",
    cause: error.cause,
  });
}

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
    const error = normalizeProcedureError(result.error);
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

  if (Array.isArray(result.data) && result.data.length >= PUBLIC_COLLECTION_LIMIT) {
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

const requireSession = t.middleware(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

const requireAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
      cause: "No session",
    });
  }

  const rule = resolveAdminRule({
    ownerGithubId: env.GITHUB_USER_ID,
    configuredUsername: env.GITHUB_USERNAME,
  });

  const githubAccountIds = rule.kind === "githubId"
    ? (await ctx.db
        .select({ accountId: account.accountId })
        .from(account)
        .where(and(eq(account.userId, ctx.session.user.id), eq(account.providerId, "github"))))
        .map((row) => row.accountId)
    : undefined;

  const firstUserId = rule.kind === "firstUser"
    ? (await ctx.db
        .select({ id: user.id })
        .from(user)
        .orderBy(asc(user.createdAt), asc(user.id))
        .limit(1))[0]?.id
    : undefined;

  if (!isAdministrator(rule, {
    userId: ctx.session.user.id,
    userName: ctx.session.user.name,
    githubAccountIds,
    firstUserId,
  })) {
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

export const protectedProcedure = t.procedure.use(errorBoundary).use(requireSession);

export const adminProcedure = t.procedure.use(errorBoundary).use(requireAdmin);
