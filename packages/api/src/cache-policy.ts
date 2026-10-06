export const CACHE_TTL_DEFAULT_SECONDS = 60;
export const PUBLIC_EDGE_CONSISTENCY_WINDOW_SECONDS = CACHE_TTL_DEFAULT_SECONDS;

export type CacheClassification = "public" | "private" | "never";

type ProcedureCachePolicy = {
  classification: CacheClassification;
  ttlSeconds: number;
};

export const PROCEDURE_CACHE_POLICY: Record<string, ProcedureCachePolicy> = {
  "players.search": { classification: "public", ttlSeconds: 30 },
  "players.byId": { classification: "public", ttlSeconds: 120 },
  "players.stats": { classification: "public", ttlSeconds: 120 },
  "players.circuitSeasons": { classification: "public", ttlSeconds: 120 },
  "players.ranking": { classification: "public", ttlSeconds: 120 },
  "players.season": { classification: "public", ttlSeconds: 300 },
  "records.all": { classification: "public", ttlSeconds: 300 },
  "records.badges": { classification: "public", ttlSeconds: 300 },
  "records.monthHighlight": { classification: "public", ttlSeconds: 300 },
  "records.recent": { classification: "public", ttlSeconds: 300 },
  "clubs.leaderboard": { classification: "public", ttlSeconds: 300 },
  "clubs.byId": { classification: "public", ttlSeconds: 300 },
  "announcements.byPlayer": { classification: "public", ttlSeconds: 120 },
  "players.withFilters": { classification: "public", ttlSeconds: 120 },
  "players.page": { classification: "private", ttlSeconds: 0 },
  "topPlayers.list": { classification: "public", ttlSeconds: 300 },
  "circuits.listSimple": { classification: "public", ttlSeconds: 300 },
  "circuits.byId": { classification: "public", ttlSeconds: 300 },
  "clubs.list": { classification: "public", ttlSeconds: 300 },
  "clubs.search": { classification: "public", ttlSeconds: 30 },
  "locations.list": { classification: "public", ttlSeconds: 300 },
  "titles.list": { classification: "public", ttlSeconds: 300 },
  "roles.list": { classification: "public", ttlSeconds: 300 },
  "roles.listWithPlayers": { classification: "public", ttlSeconds: 300 },
  "titledPlayers.list": { classification: "public", ttlSeconds: 300 },
  "swissManager.list": { classification: "public", ttlSeconds: 300 },
  "events.list": { classification: "public", ttlSeconds: 60 },
  "posts.list": { classification: "public", ttlSeconds: 120 },
  "posts.bySlug": { classification: "public", ttlSeconds: 120 },
  "posts.byPage": { classification: "public", ttlSeconds: 120 },
  "posts.fresh": { classification: "public", ttlSeconds: 60 },
  "announcements.list": { classification: "public", ttlSeconds: 120 },
  "announcements.byId": { classification: "public", ttlSeconds: 120 },
  "announcements.byPage": { classification: "public", ttlSeconds: 120 },
  "announcements.fresh": { classification: "public", ttlSeconds: 60 },
  "tvSergipe.list": { classification: "public", ttlSeconds: 300 },
  "tvSergipe.leaderboard": { classification: "public", ttlSeconds: 300 },
  "tournaments.list": { classification: "public", ttlSeconds: 300 },
  "tournaments.search": { classification: "public", ttlSeconds: 30 },
  "tournaments.byId": { classification: "public", ttlSeconds: 120 },
  "cups.list": { classification: "public", ttlSeconds: 300 },
  "cups.byId": { classification: "public", ttlSeconds: 120 },
  "tournamentPodiums.list": { classification: "public", ttlSeconds: 300 },
  "champions.list": { classification: "public", ttlSeconds: 300 },
  "champions.gallery": { classification: "public", ttlSeconds: 300 },
  "norms.list": { classification: "public", ttlSeconds: 300 },
  "insignias.list": { classification: "public", ttlSeconds: 300 },
  "links.list": { classification: "public", ttlSeconds: 300 },
};

export function getProcedureCachePolicy(pathname: string): ProcedureCachePolicy {
  const procedures = pathname.replace(/^\/api\/trpc\//, "").split(",");
  const policies = procedures.map((procedure) => PROCEDURE_CACHE_POLICY[procedure]);
  if (policies.some((policy) => !policy)) {
    return { classification: "never", ttlSeconds: 0 };
  }
  const typedPolicies = policies as ProcedureCachePolicy[];
  if (typedPolicies.some((policy) => policy.classification !== "public")) {
    return { classification: "never", ttlSeconds: 0 };
  }
  return {
    classification: "public",
    ttlSeconds: Math.min(...typedPolicies.map((policy) => policy.ttlSeconds)),
  };
}

export function resolveProcedureTtl(pathname: string): number {
  const policy = getProcedureCachePolicy(pathname);
  return policy.ttlSeconds || CACHE_TTL_DEFAULT_SECONDS;
}

export function shouldCachePublicQuery(input: {
  method: string;
  status: number;
  authenticated: boolean;
  cacheable?: boolean;
}): boolean {
  return input.method === "GET" && input.status === 200 && !input.authenticated && input.cacheable !== false;
}

export function hasSessionCookie(cookieHeader: string): boolean {
  return cookieHeader.split(";").some((part) => {
    const name = part.trim().split("=", 1)[0];
    return name === "session_token" ||
      name === "better-auth.session_token" ||
      name === "__Secure-better-auth.session_token" ||
      name === "__Host-better-auth.session_token";
  });
}

export function isSuccessfulTrpcPayload(payload: unknown): boolean {
  const results = Array.isArray(payload) ? payload : [payload];
  return results.length > 0 && results.every((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const record = entry as Record<string, unknown>;
    return "result" in record && !("error" in record);
  });
}
