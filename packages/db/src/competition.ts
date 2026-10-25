// Places that earn a medal (profile, medal counts, school-circuit and School Games podium sync).
// Final standings may store more places; they just are not medals.
export const MEDAL_PLACES = 3;

export const isMedalPlace = (place: number | null | undefined): place is number =>
  place != null && place >= 1 && place <= MEDAL_PLACES;

export const COMPETITION_TIERS = ["S", "A", "B", "school"] as const;

export type CompetitionTier = (typeof COMPETITION_TIERS)[number];

export const COMPETITION_TIER_LABELS: Record<CompetitionTier, string> = {
  S: "Tier S",
  A: "Tier A",
  B: "Tier B",
  school: "School",
};
