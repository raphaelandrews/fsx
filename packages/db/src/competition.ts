export const COMPETITION_CATEGORIES = [
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

export type CompetitionCategory = (typeof COMPETITION_CATEGORIES)[number];

export const COMPETITION_TIERS = ["S", "A", "B", "school"] as const;

export type CompetitionTier = (typeof COMPETITION_TIERS)[number];

export const COMPETITION_TIER_LABELS: Record<CompetitionTier, string> = {
  S: "Tier S",
  A: "Tier A",
  B: "Tier B",
  school: "School",
};
