import { sql } from "drizzle-orm";

// Inlined into CHECK constraints: drizzle-kit writes check SQL verbatim, so the
// list cannot be a bound parameter.
export const sqlInList = (values: readonly string[]) =>
  sql.raw(values.map((value) => `'${value.replaceAll("'", "''")}'`).join(", "));
