const FEDERATION_TIME_ZONE = "America/Sao_Paulo";

// The federation's calendar day (YYYY-MM-DD), not UTC's, around midnight.
export const federationToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: FEDERATION_TIME_ZONE }).format(new Date());

export const federationYear = () => Number(federationToday().slice(0, 4));
