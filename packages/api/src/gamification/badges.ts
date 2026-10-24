import type { RatingType } from "../rating-types";
import {
  GAIN_STEPS,
  MARATHON_STEPS,
  POSITIVE_STREAK_STEPS,
  RATING_THRESHOLDS,
  STAGE_PODIUM_STEPS,
  TOURNAMENTS_PLAYED_STEPS,
  VETERAN_SEASON_STEPS,
} from "./constants";
import { COMPETITION_CATEGORIES, type CompetitionTier } from "../circuit-types";
import { CROWN_FORMATS, SERGIPANO_KINDS, SERGIPANO_LABELS, type CrownFormat, type SergipanoKind } from "./sergipano";
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
  | "record"
  | "crown";

export interface Achievement extends Provenance {
  id: string;
  family: string;
  label: string;
  description: string;
  icon: BadgeIcon;
  tier: BadgeTier;
  // The specific championship behind a generic emblem, for the holder's own profile only.
  detail?: string;
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

// Repeat wins of the same Sergipano: every kind has the same ladder, so no emblem exists only
// because one player did something unusual in one championship. Consecutive years are told apart
// from the championship only on the holder's profile (`detail`).
const DYNASTY_WIN_STEPS = [
  { count: 2, label: "Bicampeão(ã)", tier: "silver" },
  { count: 3, label: "Tricampeão(ã)", tier: "gold" },
  { count: 5, label: "Pentacampeão(ã)", tier: "platinum" },
] as const;
const DYNASTY_RUN_STEPS = [
  { length: 2, tier: "gold" },
  { length: 3, tier: "platinum" },
] as const;
const dynastyWinLabel = (label: string, kind: SergipanoKind) => `${label} · ${SERGIPANO_LABELS[kind]}`;
const dynastyWinText = (kind: SergipanoKind, count: number) => `Venceu o Campeonato Sergipano ${SERGIPANO_LABELS[kind]} ${count} vezes.`;
const dynastyRunText = (length: number) => `Venceu o mesmo campeonato em ${length} anos consecutivos, qualquer um.`;
const dynastyRunLabel = (length: number) => `${length} títulos seguidos`;

// Age-less categories are not youth champions, so they earn no category emblem.
const CATEGORIES_WITHOUT_BADGE: readonly string[] = ["Futuro", "Juvenil", "Master"];
const hasCategoryBadge = (category: string) => !CATEGORIES_WITHOUT_BADGE.includes(category);

const categoryBadgeId = (category: string) => `category-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

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

// The win that first completes `length` consecutive years of titles in one championship.
function runCompletedAt(dynasty: PlayerStats["dynasties"][number], length: number): Provenance[] {
  const byYear = new Map<number, Provenance>();
  for (const win of dynasty.wins) if (win.year !== null && !byYear.has(win.year)) byYear.set(win.year, win);
  const years = [...byYear.keys()].sort((a, b) => a - b);
  for (let i = length - 1; i < years.length; i++) {
    if (years[i]! - years[i - length + 1]! === length - 1) return [byYear.get(years[i]!)!];
  }
  return [];
}

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
    earned: (stats) => [
      ...SERGIPANO_KINDS.flatMap((kind) =>
        DYNASTY_WIN_STEPS.flatMap(({ count, label, tier }) => {
          const reached = stats.sergipanoTitles.filter((title) => title.kind === kind)[count - 1];
          if (!reached) return [];
          return [
            {
              earnedAt: reached.earnedAt,
              tournamentId: reached.tournamentId,
              legacy: reached.legacy,
              id: `dynasty-${kind}-${count}`,
              family: "dynasty",
              label: dynastyWinLabel(label, kind),
              description: dynastyWinText(kind, count),
              icon: "trophy" as const,
              tier,
            },
          ];
        }),
      ),
      ...DYNASTY_RUN_STEPS.flatMap(({ length, tier }) => {
        const reached = earliest(stats.dynasties.flatMap((dynasty) => runCompletedAt(dynasty, length).map((win) => ({ ...win, name: dynasty.championshipName }))));
        if (!reached) return [];
        return [
          {
            earnedAt: reached.earnedAt,
            tournamentId: reached.tournamentId,
            legacy: reached.legacy,
            id: `dynasty-run-${length}`,
            family: "dynasty",
            label: dynastyRunLabel(length),
            description: dynastyRunText(length),
            detail: reached.name,
            icon: "trophy" as const,
            tier,
          },
        ];
      }),
    ],
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
          description: "Jogou todas as etapas de uma temporada de circuito.",
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
      stats.categoryWins.filter(({ category }) => hasCategoryBadge(category)).map(({ category, ...provenance }) => ({
        ...provenance,
        id: categoryBadgeId(category),
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

const TIER_WIN_STEPS = [1, 3, 5] as const;
const TIER_NAMES: Record<CompetitionTier, { label: string; of: string }> = {
  S: { label: "Sergipano", of: "em campeonatos Sergipanos (Tier S)" },
  A: { label: "Tier A", of: "em torneios Tier A" },
  B: { label: "Tier B", of: "em torneios Tier B" },
  school: { label: "Escolar", of: "em torneios escolares" },
};

const CROWN_TEXT = {
  1: "Foi campeão(ã) sergipano(a) no clássico (Absoluto ou Feminino), no rápido e na blitz.",
  2: "Venceu duas vezes o Sergipano do clássico (Absoluto ou Feminino), duas do rápido e duas da blitz.",
} as const;
const SLAM_TEXT = "Venceu o Sergipano do clássico, do rápido, da blitz, do bullet e de equipes.";
const ALL_PODIUMS_TEXT = "Subiu ao pódio em torneios Sergipanos, Tier A, Tier B e escolares.";
const tierWinLabel = (tier: CompetitionTier, count: number) =>
  count === 1 ? `Campeão(ã) · ${TIER_NAMES[tier].label}` : `${count} títulos · ${TIER_NAMES[tier].label}`;
const tierWinText = (tier: CompetitionTier, count: number) =>
  `Venceu ${count === 1 ? "um torneio" : `${count} torneios`} ${TIER_NAMES[tier].of}.`;

// The moment the last of several milestones was reached; unknown if any is undated.
function completedAt(milestones: Provenance[]): Provenance {
  if (milestones.some((milestone) => milestone.earnedAt === null)) return { earnedAt: null, tournamentId: null, legacy: false };
  return [...milestones].sort((a, b) => (a.earnedAt! < b.earnedAt! ? 1 : -1))[0]!;
}

BADGE_FAMILIES.push(
  {
    id: "sergipano",
    earned: (stats) => {
      const earned: Achievement[] = [];
      for (const kind of SERGIPANO_KINDS) {
        const first = stats.sergipanoTitles.find((title) => title.kind === kind);
        if (!first) continue;
        earned.push({
          earnedAt: first.earnedAt,
          tournamentId: first.tournamentId,
          legacy: first.legacy,
          id: `sergipano-${kind}`,
          family: "sergipano",
          label: `Campeão(ã) Sergipano · ${SERGIPANO_LABELS[kind]}`,
          description: `Venceu o Campeonato Sergipano ${SERGIPANO_LABELS[kind]} na classificação geral.`,
          icon: "trophy",
          tier: kind === "absoluto" || kind === "feminino" ? "gold" : "silver",
        });
      }

      const byFormat = new Map<CrownFormat, Provenance[]>();
      for (const title of stats.sergipanoTitles) {
        const format = CROWN_FORMATS[title.kind];
        if (format) byFormat.set(format, [...(byFormat.get(format) ?? []), title]);
      }
      const crownFormats: CrownFormat[] = ["classic", "rapid", "blitz"];
      ([1, 2] as const).forEach((count) => {
        const reached = crownFormats.map((format) => byFormat.get(format)?.[count - 1]);
        if (reached.some((title) => !title)) return;
        earned.push({
          ...completedAt(reached as Provenance[]),
          id: `sergipano-crown-${count}`,
          family: "sergipano",
          label: count === 1 ? "Tríplice Coroa Sergipana" : "Tríplice Coroa em dobro",
          description: CROWN_TEXT[count],
          icon: "crown",
          tier: count === 1 ? "gold" : "platinum",
        });
      });

      const slamKinds = ["classic", "rapid", "blitz", "bullet", "equipes"] as const;
      const slam = slamKinds.map((group) =>
        stats.sergipanoTitles.find((title) =>
          group === "bullet" || group === "equipes" ? title.kind === group : CROWN_FORMATS[title.kind] === group,
        ),
      );
      if (slam.every(Boolean)) {
        earned.push({
          ...completedAt(slam as Provenance[]),
          id: "sergipano-slam",
          family: "sergipano",
          label: "Grand Slam Sergipano",
          description: SLAM_TEXT,
          icon: "crown",
          tier: "platinum",
        });
      }
      return earned;
    },
  },
  {
    id: "tier",
    earned: (stats) => {
      const earned: Achievement[] = [];
      for (const tier of ["S", "A", "B", "school"] as const) {
        const wins = stats.tierWins[tier];
        TIER_WIN_STEPS.forEach((count, index) => {
          const reached = wins[count - 1];
          if (!reached) return;
          earned.push({
            ...reached,
            id: `tier-${tier}-${count}`,
            family: "tier",
            label: tierWinLabel(tier, count),
            description: tierWinText(tier, count),
            icon: "trophy",
            tier: LADDER_TIERS[index]!,
          });
        });
      }
      const podiums = (["S", "A", "B", "school"] as const).map((tier) => stats.tierPodiums[tier]);
      if (podiums.every(Boolean)) {
        earned.push({
          ...completedAt(podiums as Provenance[]),
          id: "tier-all-podiums",
          family: "tier",
          label: "Pódio em todos os níveis",
          description: ALL_PODIUMS_TEXT,
          icon: "podium",
          tier: "platinum",
        });
      }
      return earned;
    },
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

// A cup title (Bullet) has no tournament behind it, so it counts as a career too.
const hasRecordedCareer = (stats: PlayerStats) => stats.tournamentsPlayed > 0 || stats.sergipanoTitles.length > 0;

export type BadgeCatalogEntry = Pick<Achievement, "id" | "family" | "label" | "description" | "icon" | "tier">;

// Every emblem at least one player holds. Descriptions are personal ("Seu maior
// ganho é +X"), so only the generic fields are kept.
export function badgeCatalog(careers: PlayerStats[]): BadgeCatalogEntry[] {
  const catalog = new Map<string, BadgeCatalogEntry>();
  for (const stats of careers) {
    if (!hasRecordedCareer(stats)) continue;
    for (const { id, family, label, description, icon, tier } of achievementsOf(stats)) {
      if (!catalog.has(id)) {
        catalog.set(id, { id, family, label, description, icon, tier });
      }
    }
  }
  return [...catalog.values()];
}

// Every emblem that can exist, earned or not, so the public list can show what is
// still out there. Mirrors BADGE_FAMILIES (badges.test.ts checks they agree).
// The descriptions must not mention one player's own numbers.
export function allBadges(): BadgeCatalogEntry[] {
  const entry = (
    id: string,
    family: string,
    label: string,
    description: string,
    icon: BadgeIcon,
    tier: BadgeTier,
  ): BadgeCatalogEntry => ({ id, family, label, description, icon, tier });
  const formats = ["classic", "rapid", "blitz"] as const;
  return [
    ...formats.flatMap((format) =>
      RATING_THRESHOLDS.map((threshold) =>
        entry(
          `rating-${format}-${threshold}`,
          "rating",
          `${threshold} ${FORMAT_LABELS[format].in}`,
          `Atingiu ${threshold} de rating FSX no ritmo ${FORMAT_LABELS[format].name}.`,
          "rating",
          THRESHOLD_TIERS[threshold] ?? "bronze",
        ),
      ),
    ),
    ...TOURNAMENTS_PLAYED_STEPS.map((count, i) =>
      entry(`tournaments-${count}`, "tournaments", `${count} torneios`, `Disputou ${count} torneios registrados pela FSX.`, "tournaments", STEP_TIERS[i]!),
    ),
    ...POSITIVE_STREAK_STEPS.map((length, i) =>
      entry(`streak-${length}`, "streak", `${length} torneios seguidos subindo`, `Ganhou rating em ${length} torneios seguidos no mesmo ritmo.`, "streak", STEP_TIERS[i]!),
    ),
    entry("first-tournament", "first", "Primeiro torneio", "Disputou o primeiro torneio registrado pela FSX.", "first", "bronze"),
    entry("first-positive-result", "first", "Primeiro ganho de rating", "Ganhou rating pela primeira vez em um torneio.", "first", "bronze"),
    entry("first-podium", "first", "Primeiro pódio", "Subiu ao pódio pela primeira vez.", "first", "bronze"),
    ...VETERAN_SEASON_STEPS.map((count, i) =>
      entry(`veteran-${count}`, "veteran", `Veterano · ${count} temporadas`, `Disputou torneios em ${count} temporadas diferentes.`, "veteran", LADDER_TIERS[i]!),
    ),
    ...MARATHON_STEPS.map((count, i) =>
      entry(`marathon-${count}`, "marathon", `Maratonista · ${count} no ano`, `Disputou ${count} torneios em um mesmo ano.`, "marathon", LADDER_TIERS[i]!),
    ),
    entry("formats-year", "formats", "Tríplice", "Jogou clássico, rápido e blitz em um mesmo ano.", "formats", "silver"),
    entry("formats-2000", "formats", "Tríplice 2000", "Atingiu 2000 de rating no clássico, no rápido e na blitz.", "formats", "platinum"),
    entry("comeback", "comeback", "Volta por cima", "Ganhou rating logo depois de três ou mais torneios sem ganho no mesmo ritmo.", "comeback", "bronze"),
    ...GAIN_STEPS.map((step, i) =>
      entry(`leap-${step}`, "leap", `Grande salto · +${step}`, `Ganhou ${step} pontos ou mais de rating em um único torneio.`, "leap", LADDER_TIERS[i]!),
    ),
    entry("circuit-complete", "circuit", "Circuito completo", "Jogou todas as etapas de uma temporada de circuito.", "circuit", "silver"),
    ...STAGE_PODIUM_STEPS.map((count, i) =>
      entry(`stage-podiums-${count}`, "circuit", `${count} pódios de etapa`, `Subiu ao pódio em ${count} etapas de circuito.`, "circuit", LADDER_TIERS[i]!),
    ),
    ...COMPETITION_CATEGORIES.filter(hasCategoryBadge).map((category) =>
      entry(categoryBadgeId(category), "category", `Campeão(ã) · ${category}`, `Venceu a categoria ${category} em um torneio.`, "category", "silver"),
    ),
    ...SERGIPANO_KINDS.flatMap((kind) =>
      DYNASTY_WIN_STEPS.map(({ count, label, tier }) =>
        entry(`dynasty-${kind}-${count}`, "dynasty", dynastyWinLabel(label, kind), dynastyWinText(kind, count), "trophy", tier),
      ),
    ),
    ...DYNASTY_RUN_STEPS.map(({ length, tier }) =>
      entry(`dynasty-run-${length}`, "dynasty", dynastyRunLabel(length), dynastyRunText(length), "trophy", tier),
    ),
    entry("decade", "decade", "Década", "Continua jogando dez anos depois do primeiro torneio registrado.", "decade", "gold"),
    ...SERGIPANO_KINDS.map((kind) =>
      entry(
        `sergipano-${kind}`,
        "sergipano",
        `Campeão(ã) Sergipano · ${SERGIPANO_LABELS[kind]}`,
        `Venceu o Campeonato Sergipano ${SERGIPANO_LABELS[kind]} na classificação geral.`,
        "trophy",
        kind === "absoluto" || kind === "feminino" ? "gold" : "silver",
      ),
    ),
    entry("sergipano-crown-1", "sergipano", "Tríplice Coroa Sergipana", CROWN_TEXT[1], "crown", "gold"),
    entry("sergipano-crown-2", "sergipano", "Tríplice Coroa em dobro", CROWN_TEXT[2], "crown", "platinum"),
    entry("sergipano-slam", "sergipano", "Grand Slam Sergipano", SLAM_TEXT, "crown", "platinum"),
    ...(["S", "A", "B", "school"] as const).flatMap((tier) =>
      TIER_WIN_STEPS.map((count, i) =>
        entry(
          `tier-${tier}-${count}`,
          "tier",
          tierWinLabel(tier, count),
          tierWinText(tier, count),
          "trophy",
          LADDER_TIERS[i]!,
        ),
      ),
    ),
    entry("tier-all-podiums", "tier", "Pódio em todos os níveis", ALL_PODIUMS_TEXT, "podium", "platinum"),
  ];
}

// How many players hold each emblem, over players with at least one tournament (or cup title).
export function badgeHolders(careers: PlayerStats[]): { players: number; holders: Record<string, number> } {
  const holders: Record<string, number> = {};
  let players = 0;
  for (const stats of careers) {
    if (!hasRecordedCareer(stats)) continue;
    players++;
    for (const id of new Set(achievementsOf(stats).map((achievement) => achievement.id))) {
      holders[id] = (holders[id] ?? 0) + 1;
    }
  }
  return { players, holders };
}
