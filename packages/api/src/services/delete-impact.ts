import { count, eq, inArray, or } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";
import { TRPCError } from "@trpc/server";

import { championships } from "@fsx/db/schema/championships";
import { circuitFinalPodiums } from "@fsx/db/schema/circuit-final-podiums";
import { circuitPhases } from "@fsx/db/schema/circuit-phases";
import { circuitResults } from "@fsx/db/schema/circuit-results";
import { circuits } from "@fsx/db/schema/circuits";
import { clubs } from "@fsx/db/schema/clubs";
import { cups } from "@fsx/db/schema/cups";
import { defendingChampions } from "@fsx/db/schema/defending-champions";
import { events } from "@fsx/db/schema/events";
import { insignias } from "@fsx/db/schema/insignias";
import { linkGroups } from "@fsx/db/schema/link-groups";
import { links } from "@fsx/db/schema/links";
import { locations } from "@fsx/db/schema/locations";
import { norms } from "@fsx/db/schema/norms";
import { players } from "@fsx/db/schema/players";
import { playersToInsignias } from "@fsx/db/schema/players-to-insignias";
import { playersToNorms } from "@fsx/db/schema/players-to-norms";
import { playersToRoles } from "@fsx/db/schema/players-to-roles";
import { playersToTitles } from "@fsx/db/schema/players-to-titles";
import { playersToTournaments } from "@fsx/db/schema/players-to-tournaments";
import { roles } from "@fsx/db/schema/roles";
import { titles } from "@fsx/db/schema/titles";
import { tournamentPodiums } from "@fsx/db/schema/tournament-podiums";
import { tournaments } from "@fsx/db/schema/tournaments";
import { categories } from "@fsx/db/schema/categories";
import { circuitCategories } from "@fsx/db/schema/circuit-categories";
import { scoringSchemes } from "@fsx/db/schema/scoring-schemes";
import { tvSergipe } from "@fsx/db/schema/tv-sergipe";

import type { Context } from "../context";

export const DELETE_ENTITIES = [
  "club",
  "location",
  "championship",
  "title",
  "role",
  "norm",
  "insignia",
  "tournament",
  "circuit",
  "event",
  "category",
  "scoringScheme",
] as const;
export type DeleteEntity = (typeof DELETE_ENTITIES)[number];

export interface ImpactItem {
  singular: string;
  plural: string;
  count: number;
  /** What the admin has to do about it, for a blocking item. */
  fix?: string;
}

export interface DeleteImpact {
  name: string;
  /** Records that stop the delete until they are moved or removed. */
  blockedBy: ImpactItem[];
  /** Records that disappear together with this one. */
  alsoDeletes: ImpactItem[];
}

type Db = Context["db"];
type Dependent = Omit<ImpactItem, "count"> & { count: (db: Db, id: number) => Promise<number> };

const rowsWhere = (table: SQLiteTable, column: SQLiteColumn) => async (db: Db, id: number) =>
  (await db.select({ value: count() }).from(table).where(eq(column, id)))[0]?.value ?? 0;

const dependent = (
  singular: string,
  plural: string,
  table: SQLiteTable,
  column: SQLiteColumn,
  fix?: string,
): Dependent => ({ singular, plural, count: rowsWhere(table, column), fix });

const countCircuitResults = async (db: Db, id: number) => {
  const phaseIds = db.select({ id: circuitPhases.id }).from(circuitPhases).where(eq(circuitPhases.circuitId, id));
  const rows = await db
    .select({ value: count() })
    .from(circuitResults)
    .where(or(eq(circuitResults.circuitId, id), inArray(circuitResults.circuitPhaseId, phaseIds)));
  return rows[0]?.value ?? 0;
};

const categoryUses = (label: string, table: SQLiteTable, column: SQLiteColumn): Dependent => ({
  singular: label,
  plural: `${label}s`,
  count: async (db: Db, id: number) => {
    const [category] = await db.select({ name: categories.name }).from(categories).where(eq(categories.id, id)).limit(1);
    if (!category) return 0;
    return (await db.select({ value: count() }).from(table).where(eq(column, category.name)))[0]?.value ?? 0;
  },
  fix: "Move them to another category first.",
});

const eventLinks = async (db: Db, id: number) => {
  const groupIds = db.select({ id: linkGroups.id }).from(linkGroups).where(eq(linkGroups.eventId, id));
  const rows = await db.select({ value: count() }).from(links).where(inArray(links.linkGroupId, groupIds));
  return rows[0]?.value ?? 0;
};

const reassign = "Reassign them to another record or remove them first.";

const ENTITIES: Record<
  DeleteEntity,
  {
    label: string;
    nameOf: (db: Db, id: number) => Promise<string | undefined>;
    blockedBy: Dependent[];
    alsoDeletes: Dependent[];
  }
> = {
  club: {
    label: "Club",
    nameOf: nameFrom(clubs, clubs.id, clubs.name),
    blockedBy: [
      dependent("player", "players", players, players.clubId, reassign),
      dependent("circuit stage", "circuit stages", circuitPhases, circuitPhases.clubId, reassign),
      dependent("School Games result", "School Games results", tvSergipe, tvSergipe.clubId, "Delete those results first."),
    ],
    alsoDeletes: [],
  },
  location: {
    label: "Location",
    nameOf: nameFrom(locations, locations.id, locations.name),
    blockedBy: [dependent("player", "players", players, players.locationId, reassign)],
    alsoDeletes: [],
  },
  championship: {
    label: "Championship",
    nameOf: nameFrom(championships, championships.id, championships.name),
    blockedBy: [
      dependent("tournament", "tournaments", tournaments, tournaments.championshipId, "Unlink them from the championship first."),
      dependent("cup", "cups", cups, cups.championshipId, "Unlink them from the championship first."),
      dependent("circuit", "circuits", circuits, circuits.championshipId, "Unlink them from the championship first."),
    ],
    alsoDeletes: [dependent("defending champion", "defending champions", defendingChampions, defendingChampions.championshipId)],
  },
  title: {
    label: "Title",
    nameOf: nameFrom(titles, titles.id, titles.name),
    blockedBy: [],
    alsoDeletes: [dependent("player title", "player titles", playersToTitles, playersToTitles.titleId)],
  },
  role: {
    label: "Role",
    nameOf: nameFrom(roles, roles.id, roles.name),
    blockedBy: [],
    alsoDeletes: [dependent("player role", "player roles", playersToRoles, playersToRoles.roleId)],
  },
  norm: {
    label: "Norm",
    nameOf: nameFrom(norms, norms.id, norms.name),
    blockedBy: [],
    alsoDeletes: [dependent("player norm", "player norms", playersToNorms, playersToNorms.normId)],
  },
  insignia: {
    label: "Insignia",
    nameOf: nameFrom(insignias, insignias.id, insignias.name),
    blockedBy: [],
    alsoDeletes: [dependent("player insignia", "player insignias", playersToInsignias, playersToInsignias.insigniaId)],
  },
  tournament: {
    label: "Tournament",
    nameOf: nameFrom(tournaments, tournaments.id, tournaments.name),
    blockedBy: [
      dependent(
        "rating result",
        "rating results",
        playersToTournaments,
        playersToTournaments.tournamentId,
        "Revert them first (Rating results → Revert all).",
      ),
      dependent("podium", "podiums", tournamentPodiums, tournamentPodiums.tournamentId, "Remove them first."),
      dependent("circuit stage", "circuit stages", circuitPhases, circuitPhases.tournamentId, "Remove those stages first."),
      dependent("School Games result", "School Games results", tvSergipe, tvSergipe.tournamentId, "Delete those results first."),
    ],
    alsoDeletes: [],
  },
  circuit: {
    label: "Circuit",
    nameOf: nameFrom(circuits, circuits.id, circuits.name),
    blockedBy: [
      dependent(
        "final podium",
        "final podiums",
        circuitFinalPodiums,
        circuitFinalPodiums.circuitId,
        "Reopen the season first.",
      ),
    ],
    alsoDeletes: [
      dependent("stage", "stages", circuitPhases, circuitPhases.circuitId),
      { singular: "points result", plural: "points results", count: countCircuitResults },
    ],
  },
  category: {
    label: "Category",
    nameOf: nameFrom(categories, categories.id, categories.name),
    blockedBy: [
      categoryUses("tournament podium", tournamentPodiums, tournamentPodiums.category),
      categoryUses("circuit result", circuitResults, circuitResults.category),
      categoryUses("final podium", circuitFinalPodiums, circuitFinalPodiums.category),
      categoryUses("circuit category list", circuitCategories, circuitCategories.category),
    ],
    alsoDeletes: [],
  },
  scoringScheme: {
    label: "Scoring scheme",
    nameOf: nameFrom(scoringSchemes, scoringSchemes.id, scoringSchemes.name),
    blockedBy: [
      dependent("circuit", "circuits", circuits, circuits.scoringSchemeId, "Point them at another scheme first."),
      dependent("tournament", "tournaments", tournaments, tournaments.scoringSchemeId, "Point them at another scheme first."),
    ],
    alsoDeletes: [],
  },
  event: {
    label: "Event",
    nameOf: nameFrom(events, events.id, events.name),
    blockedBy: [],
    alsoDeletes: [{ singular: "link", plural: "links", count: eventLinks }],
  },
};

function nameFrom(table: SQLiteTable, idColumn: SQLiteColumn, nameColumn: SQLiteColumn) {
  return async (db: Db, id: number) =>
    (await db.select({ name: nameColumn }).from(table).where(eq(idColumn, id)).limit(1))[0]?.name as string | undefined;
}

export async function deleteImpact(db: Db, entity: DeleteEntity, id: number): Promise<DeleteImpact> {
  const config = ENTITIES[entity];
  const name = await config.nameOf(db, id);
  if (name === undefined) throw new TRPCError({ code: "NOT_FOUND", message: `${config.label} not found` });

  const withCounts = (items: Dependent[]) =>
    Promise.all(items.map(async ({ count, ...item }) => ({ ...item, count: await count(db, id) })));
  const [blockedBy, alsoDeletes] = await Promise.all([withCounts(config.blockedBy), withCounts(config.alsoDeletes)]);
  return {
    name,
    blockedBy: blockedBy.filter((item) => item.count > 0),
    alsoDeletes: alsoDeletes.filter((item) => item.count > 0),
  };
}

const quantity = ({ count, singular, plural }: ImpactItem) => `${count} ${count === 1 ? singular : plural}`;

export function listQuantities(items: ImpactItem[]): string {
  const parts = items.map(quantity);
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : (parts[0] ?? "");
}

/** Refuses the delete with a message that names what is in the way. */
export async function assertDeletable(db: Db, entity: DeleteEntity, id: number): Promise<void> {
  const { name, blockedBy } = await deleteImpact(db, entity, id);
  if (blockedBy.length === 0) return;
  const fixes = [...new Set(blockedBy.flatMap((item) => (item.fix ? [item.fix] : [])))];
  throw new TRPCError({
    code: "CONFLICT",
    message: `${ENTITIES[entity].label} “${name}” cannot be deleted yet: it is still used by ${listQuantities(blockedBy)}. ${fixes.join(" ")}`.trim(),
  });
}
