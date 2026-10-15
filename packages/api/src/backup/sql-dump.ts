/** Splits a SQLite dump into statements, honoring quoted strings and identifiers. */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let quote: string | null = null;
  for (let index = 0; index < sql.length; index++) {
    const char = sql[index]!;
    if (quote) {
      current += char;
      if (char === quote) {
        if (sql[index + 1] === quote) current += sql[++index];
        else quote = null;
      }
      continue;
    }
    if (char === "-" && sql[index + 1] === "-") {
      while (index + 1 < sql.length && sql[index + 1] !== "\n") index++;
      continue;
    }
    if (char === "'" || char === '"' || char === "`") quote = char;
    if (char === ";") {
      if (current.trim()) statements.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}
