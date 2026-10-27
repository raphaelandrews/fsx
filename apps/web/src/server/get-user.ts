import { createServerFn } from "@tanstack/react-start";

import { isAdminSession } from "@fsx/api/http/admin-check";

import { authMiddleware } from "@/server/auth-middleware";

// The route guard asks "is this the administrator", not "is there a session", and only these fields
// reach the browser: the session token, IP and user agent stay on the server.
export const getUser = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const session = context.session;
    if (!session || !(await isAdminSession(session))) return null;
    const { id, name, email, image, createdAt } = session.user;
    return { user: { id, name, email, image: image ?? null, createdAt: createdAt.toISOString() } };
  });
