import type { RatingType } from "../routers/rating-update";
import { POSITIVE_STREAK_STEPS, RATING_THRESHOLDS, TOURNAMENTS_PLAYED_STEPS } from "./constants";
import type { PlayerStats, Provenance } from "./stats";

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";
// The web app maps these to icons, so the API stays free of UI dependencies.
export type BadgeIcon = "rating" | "tournaments" | "streak" | "first" | "podium" | "trophy";

export interface Achievement extends Provenance {
  id: string;
  family: string;
  label: string;
  description: string;
  icon: BadgeIcon;
  tier: BadgeTier;
}

interface BadgeFamily {
  id: string;
  earned: (stats: PlayerStats) => Achievement[];
}

const FORMAT_LABELS: Record<RatingType, { in: string; name: string }> = {
  classic: { in: "no clássico", name: "clássico" },
  rapid: { in: "no rápido", name: "rápido" },
  blitz: { in: "na blitz", name: "blitz" },
};

const THRESHOLD_TIERS: Record<number, BadgeTier> = {
  2000: "bronze",
  2100: "bronze",
  2200: "silver",
  2300: "gold",
  2400: "platinum",
};

const STEP_TIERS: BadgeTier[] = ["bronze", "silver", "gold", "platinum"];

const TITLE_COUNTS: Record<number, string> = {
  2: "Bicampeão(ã)",
  3: "Tricampeão(ã)",
  4: "Tetracampeão(ã)",
  5: "Pentacampeão(ã)",
  6: "Hexacampeão(ã)",
};

const byFormat = (stats: PlayerStats) =>
  (Object.entries(stats.formats) as [RatingType, PlayerStats["formats"][RatingType]][]).flatMap(
    ([format, formatStats]) => (formatStats ? [[format, formatStats] as const] : []),
  );

const earliest = <T extends Provenance>(candidates: T[]) =>
  [...candidates].sort((a, b) =>
    a.earnedAt === b.earnedAt ? 0 : a.earnedAt === null ? 1 : b.earnedAt === null ? -1 : a.earnedAt < b.earnedAt ? -1 : 1,
  )[0];

export const BADGE_FAMILIES: BadgeFamily[] = [
  {
    id: "rating",
    earned: (stats) =>
      byFormat(stats).flatMap(([format, formatStats]) =>
        formatStats.thresholds.map(({ threshold, ...provenance }) => ({
          ...provenance,
          id: `rating-${format}-${threshold}`,
          family: "rating",
          label: `${threshold} ${FORMAT_LABELS[format].in}`,
          description: `Atingiu ${threshold} de rating FSX no ritmo ${FORMAT_LABELS[format].name}.`,
          icon: "rating",
          tier: THRESHOLD_TIERS[threshold] ?? "bronze",
        })),
      ),
  },
  {
    id: "tournaments",
    earned: (stats) =>
      TOURNAMENTS_PLAYED_STEPS.flatMap((count, index) => {
        const reached = stats.played[count - 1];
        if (!reached) return [];
        return [
          {
            earnedAt: reached.date,
            tournamentId: reached.tournamentId,
            legacy: false,
            id: `tournaments-${count}`,
            family: "tournaments",
            label: `${count} torneios`,
            description: `Disputou ${count} torneios registrados pela FSX.`,
            icon: "tournaments" as const,
            tier: STEP_TIERS[index]!,
          },
        ];
      }),
  },
  {
    id: "streak",
    earned: (stats) =>
      POSITIVE_STREAK_STEPS.flatMap((length, index) => {
        const reached = earliest(byFormat(stats).flatMap(([, formatStats]) => formatStats.streakSteps.filter((step) => step.length === length)));
        if (!reached) return [];
        return [
          {
            earnedAt: reached.earnedAt,
            tournamentId: reached.tournamentId,
            legacy: reached.legacy,
            id: `streak-${length}`,
            family: "streak",
            label: `${length} torneios seguidos subindo`,
            description: `Ganhou rating em ${length} torneios seguidos no mesmo ritmo.`,
            icon: "streak" as const,
            tier: STEP_TIERS[index]!,
          },
        ];
      }),
  },
  {
    id: "first",
    earned: (stats) =>
      (
        [
          ["first-tournament", "Primeiro torneio", "Disputou o primeiro torneio registrado pela FSX.", stats.firsts.tournament],
          ["first-positive-result", "Primeiro ganho de rating", "Ganhou rating pela primeira vez em um torneio.", stats.firsts.positiveResult],
          ["first-podium", "Primeiro pódio", "Subiu ao pódio pela primeira vez.", stats.firsts.podium],
        ] as const
      ).flatMap(([id, label, description, provenance]) =>
        provenance
          ? [{ ...provenance, id, family: "first", label, description, icon: "first" as const, tier: "bronze" as const }]
          : [],
      ),
  },
  {
    id: "dynasty",
    earned: (stats) =>
      stats.dynasties.flatMap((dynasty) => {
        const count = dynasty.wins.length;
        if (count < 2) return [];
        const latest = dynasty.wins[count - 1]!;
        const titles: Achievement[] = [
          {
            earnedAt: latest.earnedAt,
            tournamentId: latest.tournamentId,
            legacy: latest.legacy,
            id: `dynasty-${dynasty.championshipId}`,
            family: "dynasty",
            label: `${TITLE_COUNTS[count] ?? `${count}× campeão(ã)`} · ${dynasty.championshipName}`,
            description: `Venceu ${count} edições do ${dynasty.championshipName}.`,
            icon: "trophy",
            tier: count >= 4 ? "platinum" : count === 3 ? "gold" : "silver",
          },
        ];
        const run = dynasty.longestRun;
        const runEnd = dynasty.wins.find((win) => win.year === run.endYear);
        if (run.length >= 2 && runEnd) {
          titles.push({
            ...titles[0]!,
            earnedAt: runEnd.earnedAt,
            tournamentId: runEnd.tournamentId,
            legacy: runEnd.legacy,
            id: `dynasty-run-${dynasty.championshipId}`,
            label: `${run.length} títulos seguidos · ${dynasty.championshipName}`,
            description: `Venceu o ${dynasty.championshipName} em ${run.length} anos consecutivos.`,
            tier: run.length >= 3 ? "platinum" : "gold",
          });
        }
        return titles;
      }),
  },
];

export function achievementsOf(stats: PlayerStats): Achievement[] {
  return BADGE_FAMILIES.flatMap((family) => family.earned(stats));
}

const LOCKED = { earnedAt: null, tournamentId: null, legacy: false } as const;

// The next step of each open ladder, shown locked as a goal: the next
// tournaments milestone and, per format played, the next rating threshold.
export function upcomingOf(stats: PlayerStats): Achievement[] {
  const upcoming: Achievement[] = [];
  const nextCount = TOURNAMENTS_PLAYED_STEPS.findIndex((count) => stats.tournamentsPlayed < count);
  if (nextCount !== -1) {
    const count = TOURNAMENTS_PLAYED_STEPS[nextCount]!;
    const missing = count - stats.tournamentsPlayed;
    upcoming.push({
      ...LOCKED,
      id: `tournaments-${count}`,
      family: "tournaments",
      label: `${count} torneios`,
      description: `Falta${missing === 1 ? "" : "m"} ${missing} torneio${missing === 1 ? "" : "s"}.`,
      icon: "tournaments",
      tier: STEP_TIERS[nextCount]!,
    });
  }
  for (const [format, formatStats] of byFormat(stats)) {
    if (formatStats.results === 0) continue;
    const threshold = RATING_THRESHOLDS.find((step) => formatStats.peak.rating < step);
    if (threshold === undefined) continue;
    upcoming.push({
      ...LOCKED,
      id: `rating-${format}-${threshold}`,
      family: "rating",
      label: `${threshold} ${FORMAT_LABELS[format].in}`,
      description: `Faltam ${threshold - formatStats.peak.rating} pontos acima do seu melhor rating ${FORMAT_LABELS[format].name}.`,
      icon: "rating",
      tier: THRESHOLD_TIERS[threshold] ?? "bronze",
    });
  }
  return upcoming;
}
