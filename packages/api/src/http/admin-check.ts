import { createDb } from "@fsx/db";
import { env } from "@fsx/env/server";

import { isSessionAdministrator } from "../index";

export const isAdminSession = (session: { user: { id: string; name: string } }) =>
  isSessionAdministrator(createDb(env.DB), session);
