import { TRPCError } from "@trpc/server";

export function requireMutationRows<T>(rows: T[], resource: string): T[] {
  if (rows.length === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: `${resource} not found` });
  }
  return rows;
}

export function requireAffectedRows(rowsAffected: number, resource: string): void {
  if (rowsAffected === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: `${resource} not found` });
  }
}
