import { Hono } from 'hono';
import { cors } from "hono/cors";

import { auth } from '@/src/lib/auth';
import { mainRoutes } from "@/src/routes/main";
import { protectedRoutes } from "@/src/routes/protected";

const allowedOrigins = process.env.BETTER_AUTH_ALLOWED_ORIGINS?.split(",") || [];

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null
  }
}>();

app.use(
  "/api/auth/*",
  cors({
    origin: (origin, _) => {
      if (allowedOrigins.includes(origin)) {
        return origin;
      }
      return undefined;
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.use(
  "/api/v1/*",
  cors({
    origin: (origin, _) => {
      if (allowedOrigins.includes(origin)) {
        return origin;
      }
      return undefined;
    },
    credentials: true,
  })
);

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

app.use("/api/v1/*", async (c, next) => {
  const user = c.get("user");
  const session = c.get("session");

  if (!user || !session) {
    return c.json(
      {
        error: "Unauthorized",
      },
      401
    );
  }
  return next();
});

app.route("/api/v1", protectedRoutes);
app.route("/api", mainRoutes);

export default app;
