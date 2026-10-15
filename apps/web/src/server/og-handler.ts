import { createPublicCaller } from "@fsx/api/http/public-caller";
import { env } from "@fsx/env/server";

import { ogVersion, playerCard, type OgKind, type PlayerCard, type PostCard } from "@/lib/og";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/seo";

const LONG_CACHE = "public, max-age=31536000, immutable";
const SHORT_CACHE = "public, max-age=3600";

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

const fallback = () =>
  new Response(null, { status: 302, headers: { Location: absoluteUrl(DEFAULT_OG_IMAGE), "Cache-Control": "no-store" } });

async function loadCard(kind: OgKind, id: string): Promise<PlayerCard | PostCard | null> {
  const caller = createPublicCaller();
  try {
    if (kind === "player") {
      if (!/^[1-9]\d{0,9}$/.test(id)) return null;
      return playerCard(await caller.players.byId({ id: Number(id) }));
    }
    const post = await caller.posts.bySlug({ slug: id });
    return { title: post.title };
  } catch (error) {
    if ((error as { code?: string }).code === "NOT_FOUND" || (error as { code?: string }).code === "BAD_REQUEST") return null;
    throw error;
  }
}

// Rendered once per (subject, content version) and kept in R2: the version changes whenever what the image
// shows changes, so a stale image is never served and nothing needs purging.
export async function handleOgRequest(request: Request, kind: string, file: string): Promise<Response> {
  const match = /^(.{1,200})\.png$/.exec(file);
  if (!match || (kind !== "player" && kind !== "post")) return notFound();
  const id = match[1]!;

  const card = await loadCard(kind, id);
  if (!card) return notFound();

  const version = ogVersion(card);
  const key = `og/${kind}/${id}-${version}.png`;
  const headers = {
    "Content-Type": "image/png",
    "Cache-Control": new URL(request.url).searchParams.get("v") === version ? LONG_CACHE : SHORT_CACHE,
    "X-Content-Type-Options": "nosniff",
  };

  const stored = await env.IMAGES.get(key);
  if (stored) return new Response(request.method === "HEAD" ? null : stored.body, { headers });

  try {
    const { renderOgPng } = await import("./og-render");
    const png = await renderOgPng(kind, card);
    await env.IMAGES.put(key, png, { httpMetadata: { contentType: "image/png" } });
    return new Response(request.method === "HEAD" ? null : png, { headers });
  } catch (error) {
    console.error("[og] render failed", { kind, id, error: error instanceof Error ? error.message : String(error) });
    return fallback();
  }
}
