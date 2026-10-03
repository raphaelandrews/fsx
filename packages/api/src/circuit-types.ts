// Circuit presentation/editing modes. The stored `circuits.type` is a free
// string validated against this list in the API layer.
// - "default": one ranking with a column per phase (etapa)
// - "categories": like default, split into category tabs
// - "school": club ranking with a players breakdown, category filter
// - "geral": no phases; a single overall player ranking
export const CIRCUIT_TYPES = ["default", "categories", "school", "geral"] as const;
export const CIRCUIT_CATEGORIES = [
  "Sub 8 Masculino",
  "Sub 10 Masculino",
  "Sub 12 Masculino",
  "Sub 14 Masculino",
  "Sub 16 Masculino",
  "Sub 18 Masculino",
  "Sub 8 Feminino",
  "Sub 10 Feminino",
  "Sub 12 Feminino",
  "Sub 14 Feminino",
  "Sub 16 Feminino",
  "Sub 18 Feminino",
  "Futuro",
  "Juvenil",
  "Master",
] as const;

export type CircuitType = (typeof CIRCUIT_TYPES)[number];

export const CIRCUIT_TYPE_LABELS: Record<CircuitType, string> = {
  default: "By stage (one ranking, a column per stage)",
  categories: "By category (one ranking per category)",
  school: "School (club ranking)",
  geral: "Overall (single list, no stages)",
};
