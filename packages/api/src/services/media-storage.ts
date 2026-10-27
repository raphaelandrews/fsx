import { clubs } from "@fsx/db/schema/clubs";
import { cups } from "@fsx/db/schema/cups";
import { locations } from "@fsx/db/schema/locations";
import { players } from "@fsx/db/schema/players";
import { posts } from "@fsx/db/schema/posts";
import { env } from "@fsx/env/server";
import { eq } from "drizzle-orm";

import type { Context } from "../context";

import { MEDIA_KEY_PATTERN } from "../media-kinds";

// Strip the public path back down to the object key so a stored relative URL
// (e.g. `/api/media/players/uuid.webp`) can be deleted from R2.
export function urlToKey(url: string): string | null {
  const marker = "/api/media/";
  const idx = url.indexOf(marker);
  const key = idx === -1 ? url : url.slice(idx + marker.length);
  if (!key || key.length > 300 || !MEDIA_KEY_PATTERN.test(key)) return null;
  try {
    return decodeURIComponent(key);
  } catch {
    return null;
  }
}

// A path can be typed into any image field, so two records may point at one object.
async function isReferenced(db: Context["db"], key: string): Promise<boolean> {
  const path = `/api/media/${key}`;
  const [a, b, c, d, e] = await db.batch([
    db.select({ id: players.id }).from(players).where(eq(players.imageUrl, path)).limit(1),
    db.select({ id: posts.id }).from(posts).where(eq(posts.imageUrl, path)).limit(1),
    db.select({ id: clubs.id }).from(clubs).where(eq(clubs.logoUrl, path)).limit(1),
    db.select({ id: locations.id }).from(locations).where(eq(locations.flagUrl, path)).limit(1),
    db.select({ id: cups.id }).from(cups).where(eq(cups.imageUrl, path)).limit(1),
  ]);
  return [a, b, c, d, e].some((rows) => rows.length > 0);
}

/** Best-effort removal of an uploaded image no record uses any more; external URLs and missing objects are ignored. */
export async function deleteMediaUrl(db: Context["db"], url: string | null | undefined): Promise<void> {
  const key = url ? urlToKey(url) : null;
  if (!key) return;
  try {
    if (await isReferenced(db, key)) return;
    await env.IMAGES.delete(key);
  } catch {}
}

/** Best-effort removal of a photo waiting under `pending/` for an update request. */
export async function deletePendingPhoto(key: string | null | undefined): Promise<void> {
  if (!key) return;
  try {
    await env.IMAGES.delete(key);
  } catch {}
}

/** Removes the previous image after an update replaced or cleared it; `next === undefined` means the field was untouched. */
export async function deleteReplacedMedia(
  db: Context["db"],
  previous: string | null | undefined,
  next: string | null | undefined,
): Promise<void> {
  if (next !== undefined && previous && previous !== next) await deleteMediaUrl(db, previous);
}
