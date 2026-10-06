import type { PlayerStats, StatsInput } from "./stats";

// Unofficial progress toward the FSX titles on /normas-tecnicas. The federation
// grants titles; this only reads the recorded data, which can't see top-5
// finishes (only podiums) or championships the board approves case by case.

// Sergipano championships listed in item 2 of the GMS requirements (ids are stable;
// names are editable). Absoluto is 1.
const LISTED_CHAMPIONSHIPS = new Set([1, 2, 3, 5]);
const ABSOLUTO = 1;

export interface TitleCheck {
  label: string;
  current: number | null;
  target: number | null;
  // null when the data can't tell (e.g. no birth date).
  met: boolean | null;
}

export interface TitleGoal {
  shortName: string;
  name: string;
  // Every check here is required…
  all: TitleCheck[];
  // …plus at least one of these, when present.
  anyOf: TitleCheck[];
  complete: boolean;
}

export interface TitlePathInput {
  stats: PlayerStats;
  podiums: StatsInput["tournamentPodiums"];
  sex: string;
  birthDate: string | null;
  heldShortNames: string[];
  year: number;
}

// The full ladder keeps youth goals from appearing after a higher title.
const LADDER = ["MMS", "MJS", "CMS", "MSE", "GMS"] as const;
const MAJOR_LADDER = ["CMS", "MSE", "GMS"] as const;

const count = (current: number, target: number, label: string): TitleCheck => ({
  label,
  current,
  target,
  met: current >= target,
});

export function titlePath({ stats, podiums, sex, birthDate, heldShortNames, year }: TitlePathInput): TitleGoal[] {
  const peak = Math.max(0, ...Object.values(stats.formats).map((format) => format?.peak.rating ?? 0));
  const listed = podiums.filter(
    (podium) => podium.category === null && podium.tournament.championshipId !== null && LISTED_CHAMPIONSHIPS.has(podium.tournament.championshipId),
  );
  const topThree = listed.filter((podium) => podium.place <= 3).length;
  const wins = listed.filter((podium) => podium.place === 1).length;
  const absolutoWins = listed.filter((podium) => podium.place === 1 && podium.tournament.championshipId === ABSOLUTO).length;
  const age = birthDate ? year - Number(birthDate.slice(0, 4)) : null;

  const rating = (target: number) => count(peak, target, `Rating ${target} em qualquer ritmo`);
  const ageAtMost = (limit: number): TitleCheck => ({
    label: `Ter ${limit} anos ou menos`,
    current: age,
    target: limit,
    met: age === null ? null : age <= limit,
  });

  const goals: TitleGoal[] = [
    {
      shortName: "GMS",
      name: "Grande Mestre Sergipano",
      all: [rating(2400)],
      anyOf: [
        count(topThree, 4, "4 pódios nos Sergipanos listados"),
        count(absolutoWins, 2, "2 títulos do Sergipano Absoluto"),
        count(wins, 3, "3 títulos nos Sergipanos listados"),
      ],
      complete: false,
    },
    {
      shortName: "MSE",
      name: "Mestre Sergipano",
      all: [rating(2300)],
      anyOf: [
        count(topThree, 2, "2 pódios nos Sergipanos listados"),
        count(absolutoWins, 1, "Título do Sergipano Absoluto"),
        count(wins, 2, "2 títulos nos Sergipanos listados"),
      ],
      complete: false,
    },
    {
      shortName: "CMS",
      name: "Candidato a Mestre Sergipano",
      // The rule asks for a top-5 finish; only podiums are recorded.
      all: [rating(2200), count(topThree, 1, "Top 5 em um Sergipano listado (contamos pódios)")],
      anyOf: [],
      complete: false,
    },
    { shortName: "MJS", name: "Mestre Júnior Sergipano", all: [rating(2100), ageAtMost(18)], anyOf: [], complete: false },
    { shortName: "MMS", name: "Mestre Mirim Sergipano", all: [rating(2000), ageAtMost(14)], anyOf: [], complete: false },
    {
      shortName: "MFS",
      name: "Mestre Feminina Sergipana",
      all: [rating(2150), { label: "Ser do gênero feminino", current: null, target: null, met: sex === "female" }],
      anyOf: [],
      complete: false,
    },
  ];

  const held = new Set(heldShortNames.map((name) => name.toUpperCase()));
  const highestHeld = Math.max(-1, ...LADDER.map((shortName, index) => (held.has(shortName) ? index : -1)));
  const nextMajorTitle = held.has("GMS") ? null : held.has("MSE") ? "GMS" : held.has("CMS") ? "MSE" : "CMS";

  return goals
    .filter((goal) => {
      if (MAJOR_LADDER.includes(goal.shortName as (typeof MAJOR_LADDER)[number])) {
        return goal.shortName === nextMajorTitle;
      }
      if (held.has(goal.shortName)) return false;
      const rung = LADDER.indexOf(goal.shortName as (typeof LADDER)[number]);
      return rung === -1 || rung > highestHeld;
    })
    .filter((goal) => goal.shortName !== "MFS" || sex === "female")
    .filter((goal) => !goal.all.some((check) => check.label.startsWith("Ter ") && check.met === false))
    .map((goal) => ({
      ...goal,
      complete: goal.all.every((check) => check.met === true) && (goal.anyOf.length === 0 || goal.anyOf.some((check) => check.met === true)),
    }));
}
