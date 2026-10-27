import { initTRPC, TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { ZodError } from "zod";
import { and, asc, eq } from "drizzle-orm";

import { isAdministrator, resolveAdminRule } from "@fsx/auth/owner";
import { account, user } from "@fsx/db/schema/auth";
import { env } from "@fsx/env/server";

import type { Context } from "./context";
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

const singular = (table: string) => (table.endsWith("ies") ? `${table.slice(0, -3)}y` : table.endsWith("s") && !table.endsWith("ss") ? table.slice(0, -1) : table);
const words = (identifier: string) => identifier.replace(/_/g, " ");

// "UNIQUE constraint failed: clubs.name" names the table and column; turn it into
// a sentence the admin can act on, without ever echoing SQL.
export function describeUniqueViolation(detail: string): string {
  const failed = /UNIQUE constraint failed: ([\w., ]+)/i.exec(detail)?.[1];
  const columns = failed?.split(",").map((part) => part.trim().split(".")) ?? [];
  const table = columns[0]?.[0];
  if (!table || columns.some((parts) => parts.length !== 2 || parts[0] !== table)) {
    return "The submitted data conflicts with an existing record.";
  }
  const subject = table.includes("_to_") ? "link" : singular(words(table));
  const article = /^[aeiou]/i.test(subject) ? "An" : "A";
  const fields = columns.map(([, column]) => words(column ?? ""));
  return fields.length === 1
    ? `${article} ${subject} with this ${fields[0]} already exists.`
    : `${article} ${subject} with the same ${fields.slice(0, -1).join(", ")} and ${fields.at(-1)} already exists.`;
}

const REMOVES_ROWS = /(delete|remove|unlink|revert)/i;

// tRPC turns anything a resolver throws that is not a TRPCError into an
// INTERNAL_SERVER_ERROR whose message is the original one (drizzle includes the
// SQL) and whose cause is the original error. Intentional TRPCErrors pass
// through; database constraint failures become actionable codes; everything
// else gets a generic message so internals never reach the client.
export function normalizeProcedureError(error: TRPCError, path = ""): TRPCError {
  const unexpected =
    error.code === "INTERNAL_SERVER_ERROR" && error.cause instanceof Error && !(error.cause instanceof TRPCError);
  if (!unexpected) return error;
  const detail = causeChainText(error.cause);
  if (/unique constraint|already exists/i.test(detail)) {
    return new TRPCError({
      code: "CONFLICT",
      message: describeUniqueViolation(detail),
      cause: error.cause,
    });
  }
  if (/foreign key constraint/i.test(detail)) {
    return new TRPCError({
      code: "CONFLICT",
      message: REMOVES_ROWS.test(path.split(".").at(-1) ?? "")
        ? "This record is still used by other data. Remove or reassign that data first."
        : "A selected record no longer exists. Reload the page and choose it again.",
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

// The one place that decides who is an administrator, shared by the procedures and the dashboard's route guard.
export async function isSessionAdministrator(
  db: Context["db"],
  session: { user: { id: string; name: string } },
): Promise<boolean> {
  const rule = resolveAdminRule({
    ownerGithubId: env.GITHUB_USER_ID,
    configuredUsername: env.GITHUB_USERNAME,
  });

  const githubAccountIds = rule.kind === "githubId"
    ? (await db
        .select({ accountId: account.accountId })
        .from(account)
        .where(and(eq(account.userId, session.user.id), eq(account.providerId, "github"))))
        .map((row) => row.accountId)
    : undefined;

  const firstUserId = rule.kind === "firstUser"
    ? (await db
        .select({ id: user.id })
        .from(user)
        .orderBy(asc(user.createdAt), asc(user.id))
        .limit(1))[0]?.id
    : undefined;

  return isAdministrator(rule, {
    userId: session.user.id,
    userName: session.user.name,
    githubAccountIds,
    firstUserId,
  });
}

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

export const protectedProcedure = t.procedure.use(errorBoundary).use(requireSession);

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
