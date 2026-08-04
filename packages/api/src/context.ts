import { createAuth } from "@fsx/auth";
import { createDb } from "@fsx/db";

export async function createContext({ req }: { req: Request }) {
  const db = createDb();
  const auth = createAuth();
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  return { db, session };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
