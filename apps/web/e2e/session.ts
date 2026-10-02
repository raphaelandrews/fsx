import type { BrowserContext } from "@playwright/test";

import { E2E_ORIGIN, E2E_SECRET, OWNER_SESSION_TOKEN, signedSessionCookie } from "./fixtures";

export async function signInAsOwner(context: BrowserContext) {
  await context.addCookies([
    {
      name: "better-auth.session_token",
      value: await signedSessionCookie(OWNER_SESSION_TOKEN, E2E_SECRET),
      url: E2E_ORIGIN,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
