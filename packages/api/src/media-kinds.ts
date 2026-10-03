// Shared by the upload procedure and the admin upload control, so this module
// must stay free of server-only imports.

export const MEDIA_KINDS = ["players", "posts", "clubs", "locations"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const RASTER_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
export const SVG_MIME = "image/svg+xml";
export const MEDIA_MIMES = [...RASTER_MIMES, SVG_MIME] as const;
export type MediaMime = (typeof MEDIA_MIMES)[number];

export const MEDIA_EXTENSIONS: Record<MediaMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export type MediaPolicy = {
  mimes: readonly MediaMime[];
  minBytes: number;
  maxBytes: number;
  /** `crop`: the admin crops to a fixed aspect. `fit`: raster images are only downscaled. */
  processing: "crop" | "fit";
  /** Longest side of a `fit` raster after downscaling. */
  maxDimension?: number;
};

const PHOTO_POLICY: MediaPolicy = {
  mimes: RASTER_MIMES,
  minBytes: 1024,
  maxBytes: 5 * 1024 * 1024,
  processing: "crop",
};

// Logos and flags render at 16–20 px; a vector or a small raster is enough, and
// a hand-made flag SVG can be a few hundred bytes.
const EMBLEM_POLICY: MediaPolicy = {
  mimes: MEDIA_MIMES,
  minBytes: 64,
  maxBytes: 512 * 1024,
  processing: "fit",
  maxDimension: 256,
};

export const MEDIA_POLICIES: Record<MediaKind, MediaPolicy> = {
  players: PHOTO_POLICY,
  posts: PHOTO_POLICY,
  clubs: EMBLEM_POLICY,
  locations: EMBLEM_POLICY,
};

export const MAX_MEDIA_BYTES = Math.max(...Object.values(MEDIA_POLICIES).map((policy) => policy.maxBytes));

const UUID = "[a-f0-9-]+";

// Each kind only matches the extensions its policy can produce, so a photo
// field never accepts an SVG path.
function keySource(...kinds: MediaKind[]): string {
  return kinds
    .map((kind) => {
      const extensions = MEDIA_POLICIES[kind].mimes.map((mime) => MEDIA_EXTENSIONS[mime]);
      return `${kind}\\/${UUID}\\.(?:${extensions.join("|")})`;
    })
    .join("|");
}

export const MEDIA_KEY_PATTERN = new RegExp(`^(?:${keySource(...MEDIA_KINDS)})$`);
export const MEDIA_PATH_PATTERN = new RegExp(`^\\/api\\/media\\/(?:${keySource(...MEDIA_KINDS)})$`);

export function mediaPathPatternFor(...kinds: MediaKind[]): RegExp {
  return new RegExp(`^\\/api\\/media\\/(?:${keySource(...kinds)})$`);
}

export function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${bytes / (1024 * 1024)} MB` : `${bytes / 1024} KB`;
}
