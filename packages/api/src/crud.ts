import { eq } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";

import type { Context } from "./context";
import { requireMutationRows } from "./errors";

type IdTable = SQLiteTable & { id: SQLiteColumn };

export async function deleteById<T extends IdTable>(
  db: Context["db"],
  table: T,
  id: number,
  resource: string,
) {
  const deleted = await db.delete(table).where(eq(table.id, id)).returning({ id: table.id });
  return requireMutationRows(deleted as { id: number }[], resource);
}
