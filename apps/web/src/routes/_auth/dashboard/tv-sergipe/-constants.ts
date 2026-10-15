export const AGE_GROUPS = ["8", "10", "12", "14", "16", "18"] as const;

export const SEX_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

export const MODALITY_OPTIONS = [
  { value: "individual", label: "Individual" },
  { value: "team", label: "Team" },
] as const;

export const TEAM_NAMES = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"] as const;

export const SEX_LABELS: Record<"male" | "female", string> = {
  male: "Male",
  female: "Female",
};

export const MODALITY_LABELS: Record<"individual" | "team", string> = {
  individual: "Individual",
  team: "Team",
};

export const PLACE_POINTS: Record<number, number> = {
  1: 10,
  2: 8,
  3: 6,
  4: 5,
  5: 4,
  6: 3,
  7: 2,
  8: 1,
};