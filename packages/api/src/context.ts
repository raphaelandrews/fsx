import { createAuth } from "@fsx/auth";
import { createDb } from "@fsx/db";
import { env } from "@fsx/env/server";

import { meterD1, type D1Meter } from "./d1-meter";

type Session = Awaited<ReturnType<ReturnType<typeof createAuth>["api"]["getSession"]>>;

export type Context = {
  db: ReturnType<typeof createDb>;
  d1?: D1Meter;
  session: Session;
  requestId: string;
};

export async function createContext({ req }: { req: Request }): Promise<Context> {
  const d1 = meterD1(env.DB);
  const auth = createAuth();
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  return {
    db: createDb(d1.binding),
    d1,
    session,
    requestId: req.headers.get("cf-ray") ?? crypto.randomUUID(),
  };
}
