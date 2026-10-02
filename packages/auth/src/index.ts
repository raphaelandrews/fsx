import { createDb } from "@fsx/db";
import * as schema from "@fsx/db/schema/auth";
import { env } from "@fsx/env/server";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { isAllowedGithubAccount, resolveAdminRule } from "./owner";

export function createAuth() {
  const db = createDb(env.DB);
  const ownerRule = resolveAdminRule({
    ownerGithubId: env.GITHUB_USER_ID,
    configuredUsername: env.GITHUB_USERNAME,
  });

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: {
      enabled: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID!,
        clientSecret: env.GITHUB_CLIENT_SECRET!,
        // Rejecting here, before Better Auth touches the database, also blocks
        // returning users; a `false` from an account hook would still create
        // the user and a session.
        mapProfileToUser: (profile) => {
          if (!isAllowedGithubAccount(ownerRule, String(profile.id))) {
            throw new APIError("FORBIDDEN", { message: "This GitHub account cannot sign in." });
          }
          return { name: profile.login };
        },
        disableSignUp: env.DISABLE_SIGNUP === "true",
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      useSecureCookies: env.BETTER_AUTH_URL.startsWith("https://"),
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (ownerRule.kind === "username") {
              if (user.name.trim().toLowerCase() !== ownerRule.configuredUsername) return false;
              return;
            }
            if (ownerRule.kind === "firstUser") {
              const existing = await db
                .select({ id: schema.user.id })
                .from(schema.user)
                .limit(1);
              if (existing.length > 0) return false;
            }
          },
        },
      },
    },
    plugins: [tanstackStartCookies()],
  });
}
