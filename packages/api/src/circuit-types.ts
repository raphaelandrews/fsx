export {
  COMPETITION_CATEGORIES,
  COMPETITION_TIER_LABELS,
  COMPETITION_TIERS,
  type CompetitionCategory,
  type CompetitionTier,
} from "@fsx/db/competition";

// Circuit presentation/editing modes. The stored `circuits.type` is a free
// string validated against this list in the API layer.
// - "default": one ranking with a column per phase (etapa)
// - "categories": like default, split into category tabs
// - "school": club ranking with a players breakdown, category filter
// - "geral": no phases; a single overall player ranking
export const CIRCUIT_TYPES = ["default", "categories", "school", "geral"] as const;

export type CircuitType = (typeof CIRCUIT_TYPES)[number];

export const CIRCUIT_TYPE_LABELS: Record<CircuitType, string> = {
  default: "By stage (one ranking, a column per stage)",
  categories: "By category (one ranking per category)",
  school: "School (club ranking)",
  geral: "Overall (single list, no stages)",
};

// Layouts that rank each category separately, so each category has its own
// champion; the others rank every row together.
export const CIRCUIT_TYPES_BY_CATEGORY: readonly CircuitType[] = ["categories", "school"];
