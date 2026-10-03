import { env } from "@fsx/env/server";

const MEDIA_PREFIX = "/api/media/";

// Opening an uploaded SVG directly would otherwise render it as a document in
// the site's origin. `sandbox` gives it an opaque origin and blocks scripts;
// `<img>` rendering is unaffected.
export const MEDIA_CSP = "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox";

function notFound(): Response {
  return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}

function decodeKey(pathname: string): string | null {
  if (pathname.length <= MEDIA_PREFIX.length) return null;
  try {
    return decodeURIComponent(pathname.slice(MEDIA_PREFIX.length));
  } catch {
    return null;
  }
}

// Serve uploaded images straight from the R2 bucket. The stored imageUrl
// is the relative path `/api/media/<key>`, so no bucket custom domain is
// needed and the same route works locally (miniflare R2) and in production.
export async function handleMediaRequest(request: Request): Promise<Response> {
  const key = decodeKey(new URL(request.url).pathname);
  if (!key || key.includes("..")) return notFound();

  // A failed precondition makes R2 return metadata without a body.
  const etag = request.headers.get("If-None-Match")?.replace(/^W\//, "").replaceAll('"', "").trim();
  const object = await env.IMAGES.get(key, etag ? { onlyIf: { etagDoesNotMatch: etag } } : undefined);
  if (!object) return notFound();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", MEDIA_CSP);

  if (!("body" in object) || !object.body) {
    return new Response(null, { status: 304, headers });
  }
  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }
  return new Response(object.body, { status: 200, headers });
}
