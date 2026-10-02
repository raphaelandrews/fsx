import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import { and, asc, eq } from "drizzle-orm";

import { isAdministrator, resolveAdminRule } from "@fsx/auth/owner";
import { account, user } from "@fsx/db/schema/auth";
import { env } from "@fsx/env/server";

import type { Context } from "./context";

export const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.code === "BAD_REQUEST" && error.cause instanceof ZodError
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

export const router = t.router;

function normalizeProcedureError(error: unknown): never {
  if (error instanceof TRPCError) throw error;
  const message = error instanceof Error ? error.message : "";
  if (/unique constraint|already exists/i.test(message)) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "The submitted data conflicts with an existing record.",
      cause: error,
    });
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected server error occurred.",
    cause: error,
  });
}

const errorBoundary = t.middleware(async ({ next, path, ctx }) => {
  const startedAt = Date.now();
  try {
    const result = await next();
    const durationMs = Date.now() - startedAt;
    if (durationMs >= 100) {
      console.info("[trpc] slow procedure", {
        path,
        requestId: ctx.requestId,
        durationMs,
        result: "success",
      });
    }
    return result;
  } catch (error) {
    console.error("[trpc] procedure failed", {
      path,
      requestId: ctx.requestId,
      durationMs: Date.now() - startedAt,
      code: error instanceof TRPCError ? error.code : "INTERNAL_SERVER_ERROR",
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    normalizeProcedureError(error);
  }
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
