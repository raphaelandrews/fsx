import type { BadgeTier } from "@fsx/api/gamification/badges";

export const TIER_CLASSES: Record<BadgeTier, string> = {
  bronze: "bg-tier-bronze text-tier-bronze-foreground",
  silver: "bg-tier-silver text-tier-silver-foreground",
  gold: "bg-tier-gold text-tier-gold-foreground",
  platinum: "bg-tier-platinum text-tier-platinum-foreground",
};

export const TIER_LABELS: Record<BadgeTier, string> = {
  bronze: "Bronze",
  silver: "Prata",
  gold: "Ouro",
  platinum: "Platina",
};

// Dates are plain YYYY-MM-DD; going through Date would shift them a day in
// UTC-3 and differ between server and client.
export const formatIsoDate = (iso: string) => iso.slice(0, 10).split("-").reverse().join("/");
