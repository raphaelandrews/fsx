import { z } from "zod";

import { isAgeGroup } from "@fsx/api/age-groups";
import { COMPETITION_TIERS } from "@fsx/api/circuit-types";
import { RATING_TYPES } from "@fsx/api/rating-types";

import { AGE_GROUPS } from "@/components/tv-sergipe/constants";

const MAX_PAGE = 1_000;

const pageParam = z.number().int().positive().max(MAX_PAGE).default(1).catch(1);
const ratingTypeParam = z.enum(RATING_TYPES).default("rapid").catch("rapid");

const listParam = z
  .array(z.string().max(80))
  .max(50)
  .default([])
  .catch([]);

export const pageSearchSchema = z.object({ page: pageParam });

export const clubsSearchSchema = z.object({
  ritmo: ratingTypeParam,
  page: pageParam,
});

export const STATISTICS_TABS = ["panorama", "recordes", "emblemas"] as const;

export const statisticsSearchSchema = z.object({
  aba: z.enum(STATISTICS_TABS).default("panorama").catch("panorama"),
});

export const ratingsSearchSchema = z.object({
  page: pageParam,
  ordenar: ratingTypeParam,
  sexo: z.enum(["male", "female"]).optional().catch(undefined),
  nome: z.string().trim().max(120).optional().catch(undefined),
  local: listParam,
  clube: listParam,
  titulo: listParam,
  grupo: listParam.transform((groups) => groups.filter(isAgeGroup)),
});

export const tvSergipeSearchSchema = z.object({
  view: z.enum(["medals", "points"]).default("medals").catch("medals"),
  idade: z.enum(AGE_GROUPS).optional().catch(undefined),
  escopo: z
    .enum([
      "geral",
      "male-individual",
      "female-individual",
      "male-team",
      "female-team",
      "male-all",
      "female-all",
    ])
    .optional()
    .catch(undefined),
  escola: z.coerce.number().int().positive().max(100_000).optional().catch(undefined),
  edicao: z.coerce.number().int().positive().max(100_000).optional().catch(undefined),
});

export const circuitsSearchSchema = z.object({
  ano: z.number().int().optional().catch(undefined),
  circuito: z.string().max(120).optional().catch(undefined),
});

export const tournamentsSearchSchema = z.object({
  page: pageParam,
  ano: z.number().int().min(1900).max(2200).optional().catch(undefined),
  nivel: z.enum(COMPETITION_TIERS).optional().catch(undefined),
  ritmo: z.enum(RATING_TYPES).optional().catch(undefined),
  campeonato: z.number().int().positive().max(100_000).optional().catch(undefined),
});

export const calendarSearchSchema = z.object({
  mes: z.number().int().min(1).max(12).optional().catch(undefined),
  // Without `mes` or `ver`, the calendar shows the next events; `ver=ano` shows the whole current year.
  ver: z.literal("ano").optional().catch(undefined),
});

export const ratingArchiveSearchSchema = z.object({
  ritmo: ratingTypeParam,
  page: pageParam,
});

const playerIdParam = z.number().int().positive().safe().optional().catch(undefined);

export const compareSearchSchema = z.object({ a: playerIdParam, b: playerIdParam });
