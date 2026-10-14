import { z } from "zod";

import { isAgeGroup } from "@fsx/api/age-groups";

import { AGE_GROUPS } from "@/components/tv-sergipe/constants";

const MAX_PAGE = 1_000;

export const pageParam = z.number().int().positive().max(MAX_PAGE).default(1).catch(1);
export const ratingTypeParam = z.enum(["classic", "rapid", "blitz"]).default("rapid").catch("rapid");

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
});

export const circuitsSearchSchema = z.object({
  ano: z.number().int().optional().catch(undefined),
  circuito: z.string().max(120).optional().catch(undefined),
});
