import type { RatingType } from "../routers/rating-update";
import {
  GAIN_STEPS,
  MARATHON_STEPS,
  POSITIVE_STREAK_STEPS,
  RATING_THRESHOLDS,
  STAGE_PODIUM_STEPS,
  TOURNAMENTS_PLAYED_STEPS,
  VETERAN_SEASON_STEPS,
} from "./constants";
import type { PlayerStats, Provenance } from "./stats";

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";
// The web app maps these to icons, so the API stays free of UI dependencies.
export type BadgeIcon =
  | "rating"
  | "tournaments"
  | "streak"
  | "first"
  | "podium"
  | "trophy"
  | "veteran"
  | "marathon"
  | "formats"
  | "comeback"
  | "leap"
  | "circuit"
  | "category"
  | "decade"
  | "record";

export interface Achievement extends Provenance {
  id: string;
  family: string;
  label: string;
  description: string;
  icon: BadgeIcon;
  tier: BadgeTier;
  // Locked emblems only: how far along the player is.
  progress?: { current: number; target: number };
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

const LADDER_TIERS: BadgeTier[] = ["bronze", "silver", "gold"];

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

// The Nth tournament of the first year with at least N, for Maratonista.
function nthInAYear(stats: PlayerStats, count: number): Provenance | null {
  const byYear = new Map<number, PlayerStats["played"]>();
  for (const entry of stats.played) {
    if (!entry.date) continue;
    const year = Number(entry.date.slice(0, 4));
    byYear.set(year, [...(byYear.get(year) ?? []), entry]);
  }
  const year = [...byYear.keys()].sort((a, b) => a - b).find((y) => byYear.get(y)!.length >= count);
  if (year === undefined) return null;
  const reached = byYear.get(year)![count - 1]!;
  return { earnedAt: reached.date, tournamentId: reached.tournamentId, legacy: false };
}

// All three 2000 steps: dated by the last one; legacy only when all three are.
function tripleThreshold(stats: PlayerStats, threshold: number): Provenance | null {
  const steps = (["classic", "rapid", "blitz"] as const).map((format) =>
    stats.formats[format]?.thresholds.find((step) => step.threshold === threshold),
  );
  if (steps.some((step) => !step)) return null;
  const all = steps as Provenance[];
  if (all.every((step) => step.legacy)) return { earnedAt: null, tournamentId: null, legacy: true };
  if (all.some((step) => step.earnedAt === null)) return { earnedAt: null, tournamentId: null, legacy: false };
  const latest = [...all].sort((a, b) => (a.earnedAt! < b.earnedAt! ? 1 : -1))[0]!;
  return latest;
}

const bestGain = (stats: PlayerStats) =>
  Math.max(0, ...Object.values(stats.formats).map((format) => format?.bestGain?.variation ?? 0));

const maxPerYear = (stats: PlayerStats) => Math.max(0, ...Object.values(stats.tournamentsByYear));

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

BADGE_FAMILIES.push(
  {
    id: "veteran",
    earned: (stats) =>
      VETERAN_SEASON_STEPS.flatMap((count, index) => {
        const start = stats.seasonStarts[count - 1];
        if (!start) return [];
        return [{
          ...start,
          id: `veteran-${count}`,
          family: "veteran",
          label: `Veterano · ${count} temporadas`,
          description: `Disputou torneios em ${count} temporadas diferentes.`,
          icon: "veteran" as const,
          tier: LADDER_TIERS[index]!,
        }];
      }),
  },
  {
    id: "marathon",
    earned: (stats) =>
      MARATHON_STEPS.flatMap((count, index) => {
        const reached = nthInAYear(stats, count);
        if (!reached) return [];
        return [{
          ...reached,
          id: `marathon-${count}`,
          family: "marathon",
          label: `Maratonista · ${count} no ano`,
          description: `Disputou ${count} torneios em um mesmo ano.`,
          icon: "marathon" as const,
          tier: LADDER_TIERS[index]!,
        }];
      }),
  },
  {
    id: "formats",
    earned: (stats) => {
      const earned: Achievement[] = [];
      if (stats.allFormatsInYear) {
        earned.push({
          ...stats.allFormatsInYear,
          id: "formats-year",
          family: "formats",
          label: "Tríplice",
          description: "Jogou clássico, rápido e blitz em um mesmo ano.",
          icon: "formats",
          tier: "silver",
        });
      }
      const triple = tripleThreshold(stats, 2000);
      if (triple) {
        earned.push({
          ...triple,
          id: "formats-2000",
          family: "formats",
          label: "Tríplice 2000",
          description: "Atingiu 2000 de rating no clássico, no rápido e na blitz.",
          icon: "formats",
          tier: "platinum",
        });
      }
      return earned;
    },
  },
  {
    id: "comeback",
    earned: (stats) => {
      const reached = earliest(byFormat(stats).flatMap(([, formatStats]) => (formatStats.comeback ? [formatStats.comeback] : [])));
      return reached
        ? [{
            ...reached,
            id: "comeback",
            family: "comeback",
            label: "Volta por cima",
            description: "Ganhou rating logo depois de três ou mais torneios sem ganho no mesmo ritmo.",
            icon: "comeback" as const,
            tier: "bronze" as const,
          }]
        : [];
    },
  },
  {
    id: "leap",
    earned: (stats) =>
      GAIN_STEPS.flatMap((step, index) => {
        const reached = earliest(byFormat(stats).flatMap(([, formatStats]) => formatStats.gainSteps.filter((gain) => gain.step === step)));
        if (!reached) return [];
        return [{
          earnedAt: reached.earnedAt,
          tournamentId: reached.tournamentId,
          legacy: reached.legacy,
          id: `leap-${step}`,
          family: "leap",
          label: `Grande salto · +${step}`,
          description: `Ganhou ${step} pontos ou mais de rating em um único torneio.`,
          icon: "leap" as const,
          tier: LADDER_TIERS[index]!,
        }];
      }),
  },
  {
    id: "circuit",
    earned: (stats) => {
      const earned: Achievement[] = [];
      const complete = stats.completeCircuits[0];
      if (complete) {
        earned.push({
          earnedAt: complete.earnedAt,
          tournamentId: complete.tournamentId,
          legacy: complete.legacy,
          id: "circuit-complete",
          family: "circuit",
          label: "Circuito completo",
          description: `Jogou todas as etapas de uma temporada de circuito (${complete.name}).`,
          icon: "circuit",
          tier: "silver",
        });
      }
      STAGE_PODIUM_STEPS.forEach((count, index) => {
        const reached = stats.stagePodiums[count - 1];
        if (!reached) return;
        earned.push({
          ...reached,
          id: `stage-podiums-${count}`,
          family: "circuit",
          label: `${count} pódios de etapa`,
          description: `Subiu ao pódio em ${count} etapas de circuito.`,
          icon: "circuit",
          tier: LADDER_TIERS[index]!,
        });
      });
      return earned;
    },
  },
  {
    id: "category",
    earned: (stats) =>
      stats.categoryWins.map(({ category, ...provenance }) => ({
        ...provenance,
        id: `category-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        family: "category",
        label: `Campeão(ã) · ${category}`,
        description: `Venceu a categoria ${category} em um torneio.`,
        icon: "category" as const,
        tier: "silver" as const,
      })),
  },
  {
    id: "decade",
    earned: (stats) =>
      stats.decade
        ? [{
            ...stats.decade,
            id: "decade",
            family: "decade",
            label: "Década",
            description: "Continua jogando dez anos depois do primeiro torneio registrado.",
            icon: "decade" as const,
            tier: "gold" as const,
          }]
        : [],
  },
);

export const RECORD_HOLDER_ID = "record-holder";

// Built from the site-wide records (records.badges), not from a single career.
export function recordHolderAchievement(records: string[]): Achievement {
  return {
    earnedAt: null,
    tournamentId: null,
    legacy: false,
    id: RECORD_HOLDER_ID,
    family: "record",
    label: "Recordista",
    description: `Lidera ${records.length === 1 ? "o recorde" : `${records.length} recordes`}: ${records.join(", ")}.`,
    icon: "record",
    tier: "platinum",
  };
}

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
      progress: { current: stats.tournamentsPlayed, target: count },
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
      progress: { current: formatStats.peak.rating, target: threshold },
    });
  }
  if (stats.tournamentsPlayed === 0) return upcoming;

  const ladder = (
    steps: readonly number[],
    current: number,
    make: (target: number, index: number) => Omit<Achievement, "earnedAt" | "tournamentId" | "legacy" | "progress">,
  ) => {
    const index = steps.findIndex((step) => current < step);
    if (index === -1) return;
    upcoming.push({ ...LOCKED, ...make(steps[index]!, index), progress: { current, target: steps[index]! } });
  };
  ladder(VETERAN_SEASON_STEPS, stats.seasons.length, (target, index) => ({
    id: `veteran-${target}`,
    family: "veteran",
    label: `Veterano · ${target} temporadas`,
    description: `Falta${target - stats.seasons.length === 1 ? "" : "m"} ${plural(target - stats.seasons.length, "temporada", "temporadas")}.`,
    icon: "veteran",
    tier: LADDER_TIERS[index]!,
  }));
  ladder(MARATHON_STEPS, maxPerYear(stats), (target, index) => ({
    id: `marathon-${target}`,
    family: "marathon",
    label: `Maratonista · ${target} no ano`,
    description: `Seu melhor ano tem ${plural(maxPerYear(stats), "torneio", "torneios")}.`,
    icon: "marathon",
    tier: LADDER_TIERS[index]!,
  }));
  if (Object.values(stats.formats).some((format) => format && format.results > 0)) {
    ladder(GAIN_STEPS, bestGain(stats), (target, index) => ({
      id: `leap-${target}`,
      family: "leap",
      label: `Grande salto · +${target}`,
      description: `Seu maior ganho em um torneio é +${bestGain(stats)}.`,
      icon: "leap",
      tier: LADDER_TIERS[index]!,
    }));
  }
  if (stats.stagePodiums.length > 0) {
    ladder(STAGE_PODIUM_STEPS, stats.stagePodiums.length, (target, index) => ({
      id: `stage-podiums-${target}`,
      family: "circuit",
      label: `${target} pódios de etapa`,
      description: `Você tem ${plural(stats.stagePodiums.length, "pódio", "pódios")} de etapa.`,
      icon: "circuit",
      tier: LADDER_TIERS[index]!,
    }));
  }
  return upcoming;
}

// How many players hold each emblem, over players with at least one tournament.
export function badgeHolders(careers: PlayerStats[]): { players: number; holders: Record<string, number> } {
  const holders: Record<string, number> = {};
  let players = 0;
  for (const stats of careers) {
    if (stats.tournamentsPlayed === 0) continue;
    players++;
    for (const id of new Set(achievementsOf(stats).map((achievement) => achievement.id))) {
      holders[id] = (holders[id] ?? 0) + 1;
    }
  }
  return { players, holders };
}
