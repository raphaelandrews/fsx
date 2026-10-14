import { env } from "@fsx/env/server";

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

/** Best-effort removal of an uploaded image; external URLs and missing objects are ignored. */
export async function deleteMediaUrl(url: string | null | undefined): Promise<void> {
  const key = url ? urlToKey(url) : null;
  if (!key) return;
  try {
    await env.IMAGES.delete(key);
  } catch {}
}

/** Removes the previous image after an update replaced or cleared it; `next === undefined` means the field was untouched. */
export async function deleteReplacedMedia(
  previous: string | null | undefined,
  next: string | null | undefined,
): Promise<void> {
  if (next !== undefined && previous && previous !== next) await deleteMediaUrl(previous);
}
