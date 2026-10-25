import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNotNull, or, sql } from "drizzle-orm";

import { circuitCategories } from "@fsx/db/schema/circuit-categories";
import { circuitFinalPodiums } from "@fsx/db/schema/circuit-final-podiums";
import { circuitPhases } from "@fsx/db/schema/circuit-phases";
import { circuitResults } from "@fsx/db/schema/circuit-results";

import type { Context } from "../context";

type Db = Context["db"];

/** The circuit a stage belongs to. */
export async function circuitOfPhase(db: Db, phaseId: number) {
  const [phase] = await db.select({ circuitId: circuitPhases.circuitId }).from(circuitPhases).where(eq(circuitPhases.id, phaseId)).limit(1);
  return phase?.circuitId;
}

/**
 * A circuit with a category list only takes those categories; without one, any is accepted.
 * No category (the overall ranking) is always accepted.
 */
export async function requireCircuitCategory(db: Db, circuitId: number | undefined, category: string | null | undefined) {
  if (!category || circuitId === undefined) return;
  const allowed = (await db.select({ category: circuitCategories.category }).from(circuitCategories).where(eq(circuitCategories.circuitId, circuitId))).map(
    (row) => row.category,
  );
  if (allowed.length > 0 && !allowed.includes(category)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `“${category}” is not one of this circuit's categories (${allowed.join(", ")}).`,
    });
  }
}

/** Refuses a new category list that leaves out a category the circuit's results already use. */
export async function assertCategoriesCoverResults(db: Db, circuitId: number, names: readonly string[]) {
  if (names.length === 0) return;
  const stageIds = db.select({ id: circuitPhases.id }).from(circuitPhases).where(eq(circuitPhases.circuitId, circuitId));
  const used = new Set<string>();
  const resultRows = await db
    .selectDistinct({ category: circuitResults.category })
    .from(circuitResults)
    .where(and(isNotNull(circuitResults.category), or(eq(circuitResults.circuitId, circuitId), inArray(circuitResults.circuitPhaseId, stageIds))));
  const finalRows = await db
    .selectDistinct({ category: circuitFinalPodiums.category })
    .from(circuitFinalPodiums)
    .where(and(isNotNull(circuitFinalPodiums.category), eq(circuitFinalPodiums.circuitId, circuitId)));
  for (const row of [...resultRows, ...finalRows]) if (row.category) used.add(row.category);
  const missing = [...used].filter((category) => !names.includes(category));
  if (missing.length > 0) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Results of this circuit already use ${missing.join(", ")}. Add ${missing.length === 1 ? "it" : "them"} to the list or move those results first.`,
    });
  }
}

/** Statements that replace a circuit's category list, for a batch. The circuit is found by name. */
export const replaceCircuitCategories = (db: Db, circuitId: number | { name: string }, names: readonly string[]) => {
  const id = typeof circuitId === "number" ? sql`${circuitId}` : sql`(SELECT id FROM circuits WHERE name = ${circuitId.name})`;
  return [
    ...(typeof circuitId === "number" ? [db.delete(circuitCategories).where(eq(circuitCategories.circuitId, circuitId))] : []),
    ...names.map((category) => db.insert(circuitCategories).values({ circuitId: id as unknown as number, category })),
  ];
};
