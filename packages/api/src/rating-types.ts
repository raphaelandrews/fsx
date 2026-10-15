export const RATING_TYPES = ["blitz", "rapid", "classic"] as const;
export type RatingType = (typeof RATING_TYPES)[number];

export const MAX_RATING = 4000;
