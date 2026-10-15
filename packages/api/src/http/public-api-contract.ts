// Constants shared by the /api/v1 handlers and the OpenAPI document. No
// runtime imports: the docs site bundles the OpenAPI document at build time.

// A stable contract for other websites, unlike /api/trpc whose URLs and shapes
// follow the app. Change fields only by adding them, or publish a /v2.
export const PUBLIC_API_TTL_SECONDS = 300;

export const PUBLIC_API_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
  // Lets pages with Cross-Origin-Embedder-Policy fetch the data too.
  "Cross-Origin-Resource-Policy": "cross-origin",
  "X-Content-Type-Options": "nosniff",
};

export type PublicPlayer = { id: number; name: string; classic: number; rapid: number; blitz: number };

// Only the birth year: the full date stays private (see ADR 0001).
export type PublicPlayerDetail = PublicPlayer & {
  birthYear: number | null;
  club: { id: number; name: string } | null;
  titles: Array<{ name: string; shortName: string; type: "internal" | "external" }>;
};
