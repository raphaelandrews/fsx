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

export interface MaintenanceResult {
  deactivated: number;
  titlesRemoved: number;
  youthTitlesWithoutBirthDate: number;
}

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

/** What the ranking snapshot changed besides recording positions, one sentence each. */
export function maintenanceNotes(result: MaintenanceResult): { tone: "info" | "warning"; text: string }[] {
  return [
    ...(result.deactivated > 0
      ? [{ tone: "info" as const, text: `${plural(result.deactivated, "player")} marked inactive: no tournament in the last 3 years.` }]
      : []),
    ...(result.titlesRemoved > 0
      ? [{ tone: "info" as const, text: `${plural(result.titlesRemoved, "youth title")} removed: the holder reaches the title's age limit this year.` }]
      : []),
    ...(result.youthTitlesWithoutBirthDate > 0
      ? [
          {
            tone: "warning" as const,
            text: `${plural(result.youthTitlesWithoutBirthDate, "youth title")} cannot expire automatically: the holder has no birth date.`,
          },
        ]
      : []),
  ];
}

export function reportMaintenance(result: MaintenanceResult) {
  for (const { tone, text } of maintenanceNotes(result)) {
    if (tone === "warning") toast.warning(text);
    else toast.info(text);
  }
}
