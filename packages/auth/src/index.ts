import { createDb } from "@fsx/db";
import * as schema from "@fsx/db/schema/auth";
import { env } from "@fsx/env/server";
import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { isAllowedGithubAccount, resolveAdminRule } from "./owner";

// Building Better Auth costs about 1.5 ms of CPU and everything it reads is fixed for the life of an isolate,
// so one instance per D1 binding serves every request (a test file gets its own binding, and so its own instance).
const instances = new WeakMap<object, ReturnType<typeof buildAuth>>();

export function createAuth() {
  let auth = instances.get(env.DB);
  if (!auth) {
    auth = buildAuth();
    instances.set(env.DB, auth);
  }
  return auth;
}

function buildAuth() {
  const db = createDb(env.DB);
  const ownerRule = resolveAdminRule({
    ownerGithubId: env.GITHUB_USER_ID,
    configuredUsername: env.GITHUB_USERNAME,
  });

  // The login and first-user rules let any GitHub account in; they are for local development only.
  const requireOwnerId = env.BETTER_AUTH_URL.startsWith("https://") && ownerRule.kind !== "githubId";

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
      // A signed cookie answers most session checks without a D1 read; signing out clears it, and a session
      // revoked in the database stays valid for at most this long.
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID!,
        clientSecret: env.GITHUB_CLIENT_SECRET!,
        // Rejecting here, before Better Auth touches the database, also blocks
        // returning users; a `false` from an account hook would still create
        // the user and a session.
        mapProfileToUser: (profile) => {
          if (requireOwnerId) {
            throw new APIError("FORBIDDEN", { message: "Sign-in is disabled until GITHUB_USER_ID is configured." });
          }
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
