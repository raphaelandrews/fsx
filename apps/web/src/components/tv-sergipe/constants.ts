export const AGE_GROUPS = ["8", "10", "12", "14", "16", "18"] as const;
export type AgeGroup = (typeof AGE_GROUPS)[number];
export type Sex = "male" | "female";
export type Modality = "individual" | "team";

export const INDIVIDUAL_MEDAL_WEIGHT = 1;
export const TEAM_MEDAL_WEIGHT = 2;

// Each (sex, modality) combo maps to a URL-safe id used in the secondary
// Tabs. `"geral"` is the catch-all for a given age (only the age filter
// applies). The explicit ids preserve every one of the 7 sub-scopes per age.
export type SubScopeId =
  | "geral"
  | "male-individual"
  | "female-individual"
  | "male-team"
  | "female-team"
  | "male-all"
  | "female-all";

export const SUB_SCOPE_TABS: { id: SubScopeId; label: string }[] = [
  { id: "geral", label: "Geral" },
  { id: "male-individual", label: "Masculino" },
  { id: "female-individual", label: "Feminino" },
  { id: "male-team", label: "Masculino Equipes" },
  { id: "female-team", label: "Feminino Equipes" },
  { id: "male-all", label: "Masculino (Indiv + Equipes)" },
  { id: "female-all", label: "Feminino (Indiv + Equipes)" },
];

export function subScopeToFilters(subScope: SubScopeId): { sex?: Sex; modality?: Modality } {
  switch (subScope) {
    case "geral":
      return {};
    case "male-individual":
      return { sex: "male", modality: "individual" };
    case "female-individual":
      return { sex: "female", modality: "individual" };
    case "male-team":
      return { sex: "male", modality: "team" };
    case "female-team":
      return { sex: "female", modality: "team" };
    case "male-all":
      return { sex: "male" };
    case "female-all":
      return { sex: "female" };
  }
}

export const AGE_LABEL: Record<AgeGroup, string> = {
  "8": "Sub 8",
  "10": "Sub 10",
  "12": "Sub 12",
  "14": "Sub 14",
  "16": "Sub 16",
  "18": "Sub 18",
};

export const SEX_LABEL: Record<Sex, string> = {
  male: "Masculino",
  female: "Feminino",
};

export const MODALITY_LABEL: Record<Modality, string> = {
  individual: "Individual",
  team: "Equipes",
};

export const MEDAL_LABEL: Record<1 | 2 | 3, string> = {
  1: "Ouro",
  2: "Prata",
  3: "Bronze",
};
