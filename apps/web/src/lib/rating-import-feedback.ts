import { toast } from "sonner";

import { getAdminErrorMessage } from "@/lib/errors";

export function describeError(err: unknown): { message: string; detail?: string } {
  const message = getAdminErrorMessage(err, "Could not update this player.");
  const fieldErrors = (
    err as { data?: { zodError?: { fieldErrors?: Record<string, string[] | undefined> } | null } }
  )?.data?.zodError?.fieldErrors;
  const fields = Object.entries(fieldErrors ?? {})
    .map(([field, issues]) => `${field}: ${issues?.join(", ")}`)
    .join("; ");
  const raw = err instanceof Error ? err.message : undefined;
  const detail = [fields, raw && raw !== message ? raw : undefined].filter(Boolean).join(" | ");
  return { message, detail: detail || undefined };
}

export function reportMaintenance(result: { deactivated: number; titlesRemoved: number; youthTitlesWithoutBirthDate: number }) {
  const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;
  if (result.deactivated > 0) {
    toast.info(`${plural(result.deactivated, "player")} marked inactive: no tournament in the last 3 years.`);
  }
  if (result.titlesRemoved > 0) {
    toast.info(`${plural(result.titlesRemoved, "youth title")} removed: the holder reaches the title's age limit this year.`);
  }
  if (result.youthTitlesWithoutBirthDate > 0) {
    toast.warning(
      `${plural(result.youthTitlesWithoutBirthDate, "youth title")} cannot expire automatically: the holder has no birth date.`,
    );
  }
}
