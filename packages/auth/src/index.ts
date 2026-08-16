import { createDb } from "@fsx/db";
import * as schema from "@fsx/db/schema/auth";
import { env } from "@fsx/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export function createAuth() {
  const db = createDb(env.DB);

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: {
      enabled: false,
    },
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID!,
        clientSecret: env.GITHUB_CLIENT_SECRET!,
        mapProfileToUser: (profile) => ({ name: profile.login }),
        disableSignUp: env.DISABLE_SIGNUP === "true",
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            const allowed = env.GITHUB_USERNAME?.trim().toLowerCase();
            if (allowed) {
              if (user.name.toLowerCase() !== allowed) {
                return false;
              }
              return;
            }
            const existing = await db
              .select({ id: schema.user.id })
              .from(schema.user)
              .limit(1);
            if (existing.length > 0) {
              return false;
            }
          },
        },
      },
    },
    plugins: [tanstackStartCookies()],
  });
}
