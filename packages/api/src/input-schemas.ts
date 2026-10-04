import { z } from "zod";

import { mediaPathPatternFor, type MediaKind } from "./media-kinds";

export const positiveInt = z.number().int().safe().min(1);
export const nonNegativeInt = z.number().int().safe().min(0);
export const rating = z.number().int().safe().min(0).max(4000);
export const points = z.number().int().safe().min(0).max(1_000_000);
export const sortOrder = nonNegativeInt.max(100_000);

export const page = positiveInt.max(1_000).default(1);
export const limit = positiveInt.max(100).default(20);
export const searchText = z.string().trim().max(120);
export const nameText = z.string().trim().min(1).max(160);
export const isoDate = z.iso.date();
export const seasonYear = z.number().int().min(1900).max(2200);
export const contentText = z.string().max(500_000);
export const httpUrl = z.string().trim().max(2_048).pipe(z.url({ protocol: /^https?$/ }));
// Uploaded images are stored as relative media paths; older rows may still hold external URLs.
export const imageUrl = z.union([z.string().trim().regex(mediaPathPatternFor("players", "posts")), httpUrl]);
// Club logos and location flags only accept uploads of their own kind.
export const emblemUrl = (kind: Extract<MediaKind, "clubs" | "locations">) =>
  z.union([z.string().trim().regex(mediaPathPatternFor(kind)), httpUrl]);
export const optionalHttpUrl = z.union([httpUrl, z.literal("")]);
export const filterArray = z.array(z.string().trim().min(1).max(80)).max(50);

export const idInput = z.object({ id: positiveInt });
