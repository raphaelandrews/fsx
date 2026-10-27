import { TRPCError } from "@trpc/server";

function causeChainText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current !== undefined && current !== null && depth < 5; depth++) {
    if (!(current instanceof Error)) {
      parts.push(String(current));
      break;
    }
    parts.push(current.message);
    current = current.cause;
  }
  return parts.join(" | ");
}

const singular = (table: string) => (table.endsWith("ies") ? `${table.slice(0, -3)}y` : table.endsWith("s") && !table.endsWith("ss") ? table.slice(0, -1) : table);
const words = (identifier: string) => identifier.replace(/_/g, " ");

// "UNIQUE constraint failed: clubs.name" names the table and column; turn it into
// a sentence the admin can act on, without ever echoing SQL.
export function describeUniqueViolation(detail: string): string {
  const failed = /UNIQUE constraint failed: ([\w., ]+)/i.exec(detail)?.[1];
  const columns = failed?.split(",").map((part) => part.trim().split(".")) ?? [];
  const table = columns[0]?.[0];
  if (!table || columns.some((parts) => parts.length !== 2 || parts[0] !== table)) {
    return "The submitted data conflicts with an existing record.";
  }
  const subject = table.includes("_to_") ? "link" : singular(words(table));
  const article = /^[aeiou]/i.test(subject) ? "An" : "A";
  const fields = columns.map(([, column]) => words(column ?? ""));
  return fields.length === 1
    ? `${article} ${subject} with this ${fields[0]} already exists.`
    : `${article} ${subject} with the same ${fields.slice(0, -1).join(", ")} and ${fields.at(-1)} already exists.`;
}

const REMOVES_ROWS = /(delete|remove|unlink|revert)/i;

// tRPC turns anything a resolver throws that is not a TRPCError into an
// INTERNAL_SERVER_ERROR whose message is the original one (drizzle includes the
// SQL) and whose cause is the original error. Intentional TRPCErrors pass
// through; database constraint failures become actionable codes; everything
// else gets a generic message so internals never reach the client.
export function normalizeProcedureError(error: TRPCError, path = ""): TRPCError {
  const unexpected =
    error.code === "INTERNAL_SERVER_ERROR" && error.cause instanceof Error && !(error.cause instanceof TRPCError);
  if (!unexpected) return error;
  const detail = causeChainText(error.cause);
  if (/unique constraint|already exists/i.test(detail)) {
    return new TRPCError({
      code: "CONFLICT",
      message: describeUniqueViolation(detail),
      cause: error.cause,
    });
  }
  if (/foreign key constraint/i.test(detail)) {
    return new TRPCError({
      code: "CONFLICT",
      message: REMOVES_ROWS.test(path.split(".").at(-1) ?? "")
        ? "This record is still used by other data. Remove or reassign that data first."
        : "A selected record no longer exists. Reload the page and choose it again.",
      cause: error.cause,
    });
  }
  if (/check constraint|not null constraint/i.test(detail)) {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: "The submitted data is not valid for this record.",
      cause: error.cause,
    });
  }
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected server error occurred.",
    cause: error.cause,
  });
}
