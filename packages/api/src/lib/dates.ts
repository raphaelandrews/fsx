const FEDERATION_TIME_ZONE = "America/Maceio";

// The federation's calendar day (YYYY-MM-DD), not UTC's, around midnight.
export const federationToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: FEDERATION_TIME_ZONE }).format(new Date());

export const federationDaysAgo = (days: number) => {
  const date = new Date(`${federationToday()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
};

export const federationYear = () => Number(federationToday().slice(0, 4));

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: FEDERATION_TIME_ZONE });
// Stored timestamps are UTC text ("YYYY-MM-DD HH:MM:SS[.mmm]"); this is the federation day they fall on.
export const federationDayOf = (utcTimestamp: string) =>
  dayFormat.format(new Date(`${utcTimestamp.replace(" ", "T")}Z`));
