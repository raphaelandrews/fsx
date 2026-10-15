const MEDIA_PREFIX = "/api/media/";
const QUALITY = 82;

const flag = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_IMAGE_TRANSFORMATIONS;

// Cloudflare resizes at the edge through /cdn-cgi/image/<options>/<path>, which fetches the original from
// /api/media. It does not exist in local dev or in the e2e Worker, so the flag is a build-time opt-in.
export const imageTransformationsEnabled = flag === "true";

const variant = (url: string, width: number) =>
  `/cdn-cgi/image/width=${width},quality=${QUALITY},format=auto/${url.slice(1)}`;

const resizable = (url: string | null | undefined, enabled: boolean): url is string =>
  enabled && !!url && url.startsWith(MEDIA_PREFIX);

/** A square avatar shown at `size` CSS pixels: 1x to 3x variants for the screen's density. */
export function avatarImage(url: string | null | undefined, size: number, enabled = imageTransformationsEnabled): { src?: string; srcSet?: string } {
  if (!resizable(url, enabled)) return { src: url ?? undefined };
  return {
    src: variant(url, size * 2),
    srcSet: [1, 2, 3].map((density) => `${variant(url, size * density)} ${density}x`).join(", "),
  };
}

/** A fluid image: width variants, and the browser picks one from `sizes`. */
export function coverImage(url: string, sizes: string, widths = [400, 800, 1200], enabled = imageTransformationsEnabled): { src: string; srcSet?: string; sizes?: string } {
  if (!resizable(url, enabled)) return { src: url };
  return {
    src: variant(url, widths[widths.length - 1]!),
    srcSet: widths.map((width) => `${variant(url, width)} ${width}w`).join(", "),
    sizes,
  };
}
