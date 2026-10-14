import { createDb } from "@fsx/db";
import { env } from "@fsx/env/server";

import { appRouter } from "../routers/index";

// For server routes that need public procedure results (share images) without an HTTP round trip.
export const createPublicCaller = (): ReturnType<typeof appRouter.createCaller> =>
  appRouter.createCaller({ db: createDb(env.DB), session: null, requestId: crypto.randomUUID() });
