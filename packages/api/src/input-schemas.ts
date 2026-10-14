import { z } from "zod";

import { federationYear } from "./lib/dates";
import { mediaPathPatternFor, type MediaKind } from "./media-kinds";
import { MAX_RATING, RATING_TYPES } from "./rating-types";

export const positiveInt = z.number().int().safe().min(1);
export const nonNegativeInt = z.number().int().safe().min(0);
export const rating = z.number().int().safe().min(0).max(MAX_RATING);
export const ratingTypeSchema = z.enum(RATING_TYPES);
export const sexSchema = z.enum(["male", "female"]);
export const points = z.number().int().safe().min(0).max(1_000_000);
export const sortOrder = nonNegativeInt.max(100_000);

export const page = positiveInt.max(1_000).default(1);
export const limit = positiveInt.max(100).default(20);
export const searchText = z.string().trim().max(120);
export const nameText = z.string().trim().min(1).max(160);
export const isoDate = z.iso.date();
// Only the year of birth is stored; the newest allowed year is the current one in the federation's calendar.
export const birthYear = z
  .number()
  .int()
  .min(1900)
  .refine((year) => year <= federationYear(), "Birth year cannot be in the future");
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
export const MAX_BULK_IDS = 200;
// Ids selected in a list for one batch action; duplicates collapse so the count stays honest.
export const bulkIds = z.array(positiveInt).min(1).max(MAX_BULK_IDS).transform((ids) => [...new Set(ids)]);
