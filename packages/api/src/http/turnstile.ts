import { env } from "@fsx/env/server";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** The secret key when Turnstile is switched on for this deployment; undefined means it is off. */
export function turnstileSecret(): string | undefined {
  return (env as { TURNSTILE_SECRET_KEY?: string }).TURNSTILE_SECRET_KEY || undefined;
}

/** Asks Cloudflare whether a challenge token is genuine. Any failure counts as "not verified". */
export async function verifyTurnstile(token: string, secret: string, fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    const response = await fetcher(VERIFY_URL, { method: "POST", body: new URLSearchParams({ secret, response: token }) });
    if (!response.ok) return false;
    return ((await response.json()) as { success?: boolean }).success === true;
  } catch {
    return false;
  }
}
