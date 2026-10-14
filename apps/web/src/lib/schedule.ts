// The federation's clock is UTC-3 all year (Brazil has no daylight saving time), so a schedule typed in the
// dashboard is converted with a fixed offset.
const OFFSET_MS = 3 * 60 * 60 * 1000;

/** `datetime-local` value ("2026-10-20T09:00", Brasília time) to the UTC instant the API takes. */
export function scheduleToInstant(local: string): string | null {
  if (!local) return null;
  const date = new Date(`${local}:00-03:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** D1 timestamp ("2026-10-20 12:00:00", UTC) to a `datetime-local` value in Brasília time. */
export function scheduleToInput(dbTimestamp: string | null): string {
  if (!dbTimestamp) return "";
  const utc = new Date(`${dbTimestamp.replace(" ", "T")}Z`);
  return Number.isNaN(utc.getTime()) ? "" : new Date(utc.getTime() - OFFSET_MS).toISOString().slice(0, 16);
}

export function formatSchedule(dbTimestamp: string): string {
  const [date, time] = scheduleToInput(dbTimestamp).split("T");
  return date && time ? `${date.split("-").reverse().join("/")} at ${time} (Brasília)` : dbTimestamp;
}

export const isScheduledInFuture = (publishAt: string | null, now = Date.now()) =>
  publishAt !== null && new Date(`${publishAt.replace(" ", "T")}Z`).getTime() > now;
