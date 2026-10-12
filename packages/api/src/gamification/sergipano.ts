import type { CompetitionTier } from "../circuit-types";

// The Sergipano championships are told apart by their championship name, since
// tournaments only record a rating type (Equipes and Bullet have none of their own).
export const SERGIPANO_KINDS = ["absoluto", "feminino", "rapido", "blitz", "bullet", "equipes"] as const;
export type SergipanoKind = (typeof SERGIPANO_KINDS)[number];

export const SERGIPANO_LABELS: Record<SergipanoKind, string> = {
  absoluto: "Absoluto",
  feminino: "Feminino",
  rapido: "Rápido",
  blitz: "Blitz",
  bullet: "Bullet",
  equipes: "Equipes",
};

const NAME_PATTERNS: [SergipanoKind, RegExp][] = [
  ["feminino", /feminin/],
  ["equipes", /equipe/],
  ["bullet", /bullet/],
  ["blitz", /blitz/],
  ["rapido", /rapid/],
  ["absoluto", /absolut/],
];

const normalize = (name: string) => name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function sergipanoKind(competition: { tier: CompetitionTier; championshipName: string | null }): SergipanoKind | null {
  if (competition.tier !== "S" || !competition.championshipName) return null;
  const name = normalize(competition.championshipName);
  return NAME_PATTERNS.find(([, pattern]) => pattern.test(name))?.[0] ?? null;
}

// Classic is split into Absoluto and Feminino; the "crown" counts either.
export type CrownFormat = "classic" | "rapid" | "blitz";
export const CROWN_FORMATS: Record<SergipanoKind, CrownFormat | null> = {
  absoluto: "classic",
  feminino: "classic",
  rapido: "rapid",
  blitz: "blitz",
  bullet: null,
  equipes: null,
};
