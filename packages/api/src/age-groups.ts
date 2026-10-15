export const AGE_GROUPS = [
  "sub-8",
  "sub-10",
  "sub-12",
  "sub-14",
  "sub-16",
  "sub-18",
  "master",
  "veterano",
  "senior",
] as const;

export type AgeGroup = (typeof AGE_GROUPS)[number];

export function isAgeGroup(value: string): value is AgeGroup {
  return (AGE_GROUPS as readonly string[]).includes(value);
}

/** Inclusive range of birth years for an age group in the given year. */
export function getBirthYearRange(group: AgeGroup, year: number): [number, number] {
  switch (group) {
    case "sub-8":
      return [year - 8, year];
    case "sub-10":
      return [year - 10, year - 9];
    case "sub-12":
      return [year - 12, year - 11];
    case "sub-14":
      return [year - 14, year - 13];
    case "sub-16":
      return [year - 16, year - 15];
    case "sub-18":
      return [year - 18, year - 17];
    case "master":
      return [year - 50, year - 40];
    case "veterano":
      return [year - 64, year - 51];
    case "senior":
      return [1900, year - 65];
  }
}
