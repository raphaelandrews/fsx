import { sql, type SQL, type SQLWrapper } from "drizzle-orm";

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

// Patterns must be built from `escapeLike` parts; the ESCAPE clause makes user
// `%`/`_` literal instead of wildcards.
export function like(expression: SQLWrapper, pattern: string): SQL {
  return sql`${expression} LIKE ${pattern} ESCAPE '\\'`;
}
