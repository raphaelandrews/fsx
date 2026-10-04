import { inArray } from "drizzle-orm";

import { computedResults } from "@fsx/db/schema/computedResults";

import type { Context } from "../context";

const DATA_CHANGED = "data_changed";
// Also recomputed daily, so a change made outside admin mutations (a migration,
// a manual SQL fix) shows up without anyone touching the dashboard.
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Returns the stored result when it was computed after the last data change,
// otherwise computes, stores, and returns it. Computing every career exceeds
// the Workers free plan's 10 ms of CPU, so it should happen once per change,
// not once per request.
export async function storedOrComputed<T>(db: Context["db"], key: string, compute: () => Promise<T>): Promise<T> {
  const rows = await db
    .select()
    .from(computedResults)
    .where(inArray(computedResults.key, [key, DATA_CHANGED]));
  const startedAt = Date.now();
  const stored = rows.find((row) => row.key === key);
  const changedAt = rows.find((row) => row.key === DATA_CHANGED)?.computedAt ?? 0;
  if (stored && stored.computedAt > changedAt && startedAt - stored.computedAt < MAX_AGE_MS) {
    return JSON.parse(stored.value) as T;
  }

  const value = await compute();
  const json = JSON.stringify(value);
  await db
    .insert(computedResults)
    .values({ key, value: json, computedAt: startedAt })
    .onConflictDoUpdate({ target: computedResults.key, set: { value: json, computedAt: startedAt } });
  return value;
}

export async function markDataChanged(db: Context["db"]) {
  const now = Date.now();
  await db
    .insert(computedResults)
    .values({ key: DATA_CHANGED, value: "", computedAt: now })
    .onConflictDoUpdate({ target: computedResults.key, set: { computedAt: now } });
}
