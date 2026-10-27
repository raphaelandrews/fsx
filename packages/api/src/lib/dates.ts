const FEDERATION_TIME_ZONE = "America/Maceio";

// The federation's calendar day (YYYY-MM-DD), not UTC's, around midnight.
export const federationToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: FEDERATION_TIME_ZONE }).format(new Date());

export const federationYear = () => Number(federationToday().slice(0, 4));

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: FEDERATION_TIME_ZONE });
const wallFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: FEDERATION_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

// Stored timestamps are UTC text ("YYYY-MM-DD HH:MM:SS[.mmm]"); this is the federation day they fall on.
export const federationDayOf = (utcTimestamp: string) =>
  dayFormat.format(new Date(`${utcTimestamp.replace(" ", "T")}Z`));

function offsetMs(instant: number) {
  const part = Object.fromEntries(wallFormat.formatToParts(instant).map(({ type, value }) => [type, Number(value)]));
  return Date.UTC(part.year!, part.month! - 1, part.day!, part.hour, part.minute, part.second) - instant;
}

function localMidnightUtc(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  const guess = Date.UTC(year!, month! - 1, date);
  return guess - offsetMs(guess - offsetMs(guess));
}

const toTimestamp = (instant: number) => new Date(instant).toISOString().replace("T", " ").slice(0, 23);

// The UTC timestamps that bound a federation day: `start <= at < end`.
export function federationDayBounds(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  const next = new Date(Date.UTC(year!, month! - 1, date! + 1)).toISOString().slice(0, 10);
  return { start: toTimestamp(localMidnightUtc(day)), end: toTimestamp(localMidnightUtc(next)) };
}
