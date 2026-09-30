// Circuit presentation/editing modes. The stored `circuits.type` is a free
// string validated against this list in the API layer.
// - "default": one ranking with a column per phase (etapa)
// - "categories": like default, split into category tabs
// - "school": club ranking with a players breakdown, category filter
// - "geral": no phases; a single overall player ranking
export const CIRCUIT_TYPES = ["default", "categories", "school", "geral"] as const;

export type CircuitType = (typeof CIRCUIT_TYPES)[number];

export const CIRCUIT_TYPE_LABELS: Record<CircuitType, string> = {
  default: "Padrão (por etapas)",
  categories: "Categorias",
  school: "Escolar (clubes)",
  geral: "Geral (lista única)",
};
