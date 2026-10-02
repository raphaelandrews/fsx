import { account, user } from "@fsx/db/schema/auth";

import type { Context } from "./context";
import type { AppRouter } from "./routers/index";
import { TEST_OWNER_GITHUB_ID } from "./test-env";

export type AdminCaller = ReturnType<AppRouter["createCaller"]>;
type CreateCaller = (ctx: Context) => AdminCaller;

export function callerAs(
  createCaller: CreateCaller,
  db: Context["db"],
  sessionUser: { id: string; name: string } | null,
): AdminCaller {
  return createCaller({
    db,
    session: sessionUser ? { user: sessionUser } : null,
    requestId: "test-request",
  } as unknown as Context);
}

export async function insertGithubUser(db: Context["db"], id: string, name: string, githubId: string) {
  await db.insert(user).values({ id, name, email: `${id}@example.com` });
  await db.insert(account).values({
    id: `${id}-github`,
    accountId: githubId,
    providerId: "github",
    userId: id,
  });
}

export async function ownerCaller(createCaller: CreateCaller, db: Context["db"]): Promise<AdminCaller> {
  await insertGithubUser(db, "owner-id", "owner", TEST_OWNER_GITHUB_ID);
  return callerAs(createCaller, db, { id: "owner-id", name: "owner" });
}
