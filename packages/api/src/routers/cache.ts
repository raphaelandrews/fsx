import { TRPCError } from "@trpc/server";

import { env } from "@fsx/env/server";

import { adminProcedure, router } from "../index";

type PurgeEnv = { CLOUDFLARE_ZONE_ID?: string; CLOUDFLARE_CACHE_PURGE_TOKEN?: string };

function purgeCredentials() {
  const { CLOUDFLARE_ZONE_ID: zoneId, CLOUDFLARE_CACHE_PURGE_TOKEN: token } = env as PurgeEnv;
  return zoneId && token ? { zoneId, token } : null;
}

export const cacheRouter = router({
  status: adminProcedure.query(() => ({ purgeConfigured: purgeCredentials() !== null })),

  // Worker cache.delete() only clears the local data center, so recovery purges
  // go through the zone purge API, which reaches every data center.
  purgePublic: adminProcedure.mutation(async ({ ctx }) => {
    const credentials = purgeCredentials();
    if (!credentials) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Cache purge is not configured (CLOUDFLARE_ZONE_ID and CLOUDFLARE_CACHE_PURGE_TOKEN).",
      });
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(credentials.zoneId)}/purge_cache`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${credentials.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ purge_everything: true }),
      },
    );
    const result = (await response.json().catch(() => null)) as { success?: boolean } | null;
    const ok = response.ok && result?.success === true;

    console.info("[audit] cache purge", {
      actorId: ctx.session.user.id,
      requestId: ctx.requestId,
      status: response.status,
      result: ok ? "success" : "failure",
    });
    if (!ok) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Cloudflare rejected the cache purge." });
    }
    return { purgedAt: new Date().toISOString() };
  }),
});
