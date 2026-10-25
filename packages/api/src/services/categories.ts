import { TRPCError } from "@trpc/server";
import { inArray } from "drizzle-orm";

import { categories } from "@fsx/db/schema/categories";

import type { Context } from "../context";

/** Refuses a category name that is not a row of `categories`; null and undefined mean "overall". */
export async function requireCategories(db: Context["db"], names: readonly (string | null | undefined)[]) {
  const wanted = [...new Set(names.filter((name): name is string => Boolean(name)))];
  if (wanted.length === 0) return;
  const known = new Set(
    (await db.select({ name: categories.name }).from(categories).where(inArray(categories.name, wanted))).map((row) => row.name),
  );
  const unknown = wanted.filter((name) => !known.has(name));
  if (unknown.length > 0) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Unknown category: ${unknown.join(", ")}` });
  }
}
