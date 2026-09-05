import { createFileRoute } from "@tanstack/react-router";
import { env } from "@fsx/env/server";

const MEDIA_PREFIX = "/api/media/";
const NOT_FOUND = "Not found";

// Serve player/post images straight from the R2 bucket. The stored imageUrl
// is the relative path `/api/media/<key>`, so no bucket custom domain is
// needed and the same route works locally (miniflare R2) and in production.
async function handler({ request }: { request: Request }): Promise<Response> {
  const path = new URL(request.url).pathname;
  const key =
    path.length > MEDIA_PREFIX.length ? decodeURIComponent(path.slice(MEDIA_PREFIX.length)) : "";

  const notFound = new Response(NOT_FOUND, { status: 404 });
  if (!key || key.includes("..")) return notFound;

  const object = await env.IMAGES.get(key);
  if (!object) return notFound;

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  if (request.method === "HEAD") {
    return new Response(null, { status: 200, headers });
  }
  return new Response(object.body, { status: 200, headers });
}

export const Route = createFileRoute("/api/media/$")({
  server: {
    handlers: {
      GET: handler,
      HEAD: handler,
    },
  },
});
