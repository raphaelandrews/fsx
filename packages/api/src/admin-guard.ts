import { and, asc, eq } from "drizzle-orm";

import { isAdministrator, resolveAdminRule } from "@fsx/auth/owner";
import { account, user } from "@fsx/db/schema/auth";
import { env } from "@fsx/env/server";

import type { Context } from "./context";

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
