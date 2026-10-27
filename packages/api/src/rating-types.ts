import type { RatingType } from "@fsx/db/competition";

export { RATING_TYPES, type RatingType } from "@fsx/db/competition";

// The public site is Portuguese and the dashboard English; these are the only spellings of the three formats.
export const RATING_LABELS_PT: Record<RatingType, string> = { classic: "Clássico", rapid: "Rápido", blitz: "Blitz" };
export const RATING_LABELS_EN: Record<RatingType, string> = { classic: "Classic", rapid: "Rapid", blitz: "Blitz" };

export const MAX_RATING = 4000;
