import { eq, inArray, sql } from "drizzle-orm";

import { changeLog, type ChangeAction, type ChangeEntity } from "@fsx/db/schema/change-log";
import { players } from "@fsx/db/schema/players";
import { tournamentPodiums } from "@fsx/db/schema/tournament-podiums";
import { tournaments } from "@fsx/db/schema/tournaments";

import type { Context } from "../context";
import { MAX_BULK_IDS } from "../input-schemas";

export const CHANGE_LOG_RETENTION_YEARS = 2;
const ROWS_PER_INSERT = 12;

type Values = Record<string, unknown>;
type Snapshot = { label: string; values: Values };

type Spec = {
  entity: ChangeEntity;
  action: ChangeAction;
  /** Records the action touched. Creates read them from the result, which does not exist before the call. */
  ids: (input: unknown, result: unknown) => number[];
};

const asRecord = (value: unknown): Record<string, unknown> => (typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {});
const positive = (value: unknown): number[] =>
  (Array.isArray(value) ? value : [value]).filter((id): id is number => Number.isSafeInteger(id) && id > 0);
const fromInput = (key: string) => (input: unknown) => positive(asRecord(input)[key]);
const fromResult = (result: unknown) => positive((Array.isArray(result) ? result : []).map((row) => asRecord(row).id));

// Mutations whose effect is recorded. Rating results keep their own, stricter trail in the rating history.
const TRACKED: Record<string, Spec[]> = {
  "players.create": [{ entity: "player", action: "create", ids: (_input, result) => fromResult(result) }],
  "players.update": [{ entity: "player", action: "update", ids: fromInput("id") }],
  "players.bulkSetActive": [{ entity: "player", action: "update", ids: fromInput("ids") }],
  "players.bulkSetClub": [{ entity: "player", action: "update", ids: fromInput("ids") }],
  "players.merge": [
    { entity: "player", action: "delete", ids: fromInput("sourceId") },
    { entity: "player", action: "update", ids: fromInput("targetId") },
  ],
  "tournaments.create": [{ entity: "tournament", action: "create", ids: (_input, result) => fromResult(result) }],
  "tournaments.update": [{ entity: "tournament", action: "update", ids: fromInput("id") }],
  "tournaments.delete": [{ entity: "tournament", action: "delete", ids: fromInput("id") }],
  "tournamentPodiums.create": [{ entity: "podium", action: "create", ids: (_input, result) => fromResult(result) }],
  "tournamentPodiums.createMany": [{ entity: "podium", action: "create", ids: (_input, result) => fromResult(result) }],
  "tournamentPodiums.update": [{ entity: "podium", action: "update", ids: fromInput("id") }],
  "tournamentPodiums.delete": [{ entity: "podium", action: "delete", ids: fromInput("id") }],
  "tournamentPodiums.bulkDelete": [{ entity: "podium", action: "delete", ids: fromInput("ids") }],
};

export const isTracked = (path: string) => path in TRACKED;

async function snapshots(db: Context["db"], entity: ChangeEntity, ids: number[]): Promise<Map<number, Snapshot>> {
  const found = new Map<number, Snapshot>();
  if (ids.length === 0) return found;
  const bounded = ids.slice(0, MAX_BULK_IDS);
  if (entity === "player") {
    const rows = await db
      .select({
        id: players.id,
        name: players.name,
        nickname: players.nickname,
        birthYear: players.birthYear,
        sex: players.sex,
        classic: players.classic,
        rapid: players.rapid,
        blitz: players.blitz,
        active: players.active,
        verified: players.verified,
        clubId: players.clubId,
        locationId: players.locationId,
        cbxId: players.cbxId,
        fideId: players.fideId,
        imageUrl: players.imageUrl,
      })
      .from(players)
      .where(inArray(players.id, bounded));
    for (const { id, ...values } of rows) found.set(id, { label: values.name, values });
  } else if (entity === "tournament") {
    const rows = await db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        date: tournaments.date,
        ratingType: tournaments.ratingType,
        tier: tournaments.tier,
        championshipId: tournaments.championshipId,
        chessResults: tournaments.chessResults,
      })
      .from(tournaments)
      .where(inArray(tournaments.id, bounded));
    for (const { id, ...values } of rows) found.set(id, { label: values.name, values });
  } else {
    const rows = await db
      .select({
        id: tournamentPodiums.id,
        playerId: tournamentPodiums.playerId,
        tournamentId: tournamentPodiums.tournamentId,
        place: tournamentPodiums.place,
        category: tournamentPodiums.category,
        // Aliased: D1 merges result columns that share a name.
        playerName: sql<string | null>`${players.name}`.as("player_name"),
        tournamentName: sql<string | null>`${tournaments.name}`.as("tournament_name"),
      })
      .from(tournamentPodiums)
      .leftJoin(players, eq(players.id, tournamentPodiums.playerId))
      .leftJoin(tournaments, eq(tournaments.id, tournamentPodiums.tournamentId))
      .where(inArray(tournamentPodiums.id, bounded));
    for (const { id, playerName, tournamentName, ...values } of rows) {
      found.set(id, { label: `${playerName ?? `Player ${values.playerId}`} · ${tournamentName ?? `Tournament ${values.tournamentId}`}`, values });
    }
  }
  return found;
}

export function diffValues(before: Values | null, after: Values | null): Record<string, [unknown, unknown]> {
  const changes: Record<string, [unknown, unknown]> = {};
  for (const field of new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])) {
    const was = before?.[field] ?? null;
    const now = after?.[field] ?? null;
    if (was !== now) changes[field] = [was, now];
  }
  return changes;
}

export type PendingChange = { specs: Spec[]; before: Map<string, Map<number, Snapshot>> };

/** Reads what the call is about to overwrite or remove. Failures never block the mutation. */
export async function captureBefore(db: Context["db"], path: string, input: unknown): Promise<PendingChange> {
  const specs = TRACKED[path] ?? [];
  const before = new Map<string, Map<number, Snapshot>>();
  await Promise.all(
    specs.map(async (spec, index) => {
      if (spec.action === "create") return;
      before.set(String(index), await snapshots(db, spec.entity, spec.ids(input, undefined)));
    }),
  );
  return { specs, before };
}

/** Players the inactivity rule switched off, recorded under a system actor. */
export async function recordDeactivations(db: Context["db"], deactivated: { id: number; name: string }[]) {
  if (deactivated.length === 0) return;
  const rows = deactivated.map(({ id, name }) => ({
    actor: "system",
    entity: "player" as const,
    recordId: id,
    label: name,
    action: "update" as const,
    procedure: "playersTournament.snapshotRankings",
    changes: JSON.stringify({ active: [true, false] }),
  }));
  const inserts = Array.from({ length: Math.ceil(rows.length / ROWS_PER_INSERT) }, (_, index) =>
    db.insert(changeLog).values(rows.slice(index * ROWS_PER_INSERT, (index + 1) * ROWS_PER_INSERT)),
  );
  await db.batch(inserts as [(typeof inserts)[number], ...(typeof inserts)[number][]]);
}

export async function writeChanges(
  db: Context["db"],
  pending: PendingChange,
  context: { actor: string; path: string; input: unknown; result: unknown },
) {
  const rows: (typeof changeLog.$inferInsert)[] = [];
  for (const [index, spec] of pending.specs.entries()) {
    const ids = spec.ids(context.input, context.result);
    const before = pending.before.get(String(index));
    const after = spec.action === "delete" ? new Map<number, Snapshot>() : await snapshots(db, spec.entity, ids);
    for (const id of ids.slice(0, MAX_BULK_IDS)) {
      const was = spec.action === "create" ? null : (before?.get(id) ?? null);
      const now = spec.action === "delete" ? null : (after.get(id) ?? null);
      const changes = diffValues(was?.values ?? null, now?.values ?? null);
      if (Object.keys(changes).length === 0) continue;
      rows.push({
        actor: context.actor,
        entity: spec.entity,
        recordId: id,
        label: (now ?? was)?.label ?? `#${id}`,
        action: spec.action,
        procedure: context.path,
        changes: JSON.stringify(changes),
      });
    }
  }
  if (rows.length === 0) return;
  // The retention rule runs with every write, so no scheduled job is needed.
  // Seven bound columns per row against D1's 100-parameter limit.
  const inserts = Array.from({ length: Math.ceil(rows.length / ROWS_PER_INSERT) }, (_, index) =>
    db.insert(changeLog).values(rows.slice(index * ROWS_PER_INSERT, (index + 1) * ROWS_PER_INSERT)),
  );
  await db.batch([
    ...(inserts as [(typeof inserts)[number], ...(typeof inserts)[number][]]),
    db.delete(changeLog).where(sql`${changeLog.createdAt} < datetime('now', ${`-${CHANGE_LOG_RETENTION_YEARS} years`})`),
  ]);
}
