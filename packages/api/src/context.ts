import { createAuth } from "@fsx/auth";
import { createDb } from "@fsx/db";
import { env } from "@fsx/env/server";

export async function createContext({ req }: { req: Request }) {
  const db = createDb(env.DB);
  const auth = createAuth();
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  return { db, session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
