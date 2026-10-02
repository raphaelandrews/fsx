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

export function getBirthDateRange(group: AgeGroup, year: number): [string, string] {
  switch (group) {
    case "sub-8":
      return [`${year - 8}-01-01`, `${year}-12-31`];
    case "sub-10":
      return [`${year - 10}-01-01`, `${year - 9}-12-31`];
    case "sub-12":
      return [`${year - 12}-01-01`, `${year - 11}-12-31`];
    case "sub-14":
      return [`${year - 14}-01-01`, `${year - 13}-12-31`];
    case "sub-16":
      return [`${year - 16}-01-01`, `${year - 15}-12-31`];
    case "sub-18":
      return [`${year - 18}-01-01`, `${year - 17}-12-31`];
    case "master":
      return [`${year - 50}-01-01`, `${year - 40}-12-31`];
    case "veterano":
      return [`${year - 64}-01-01`, `${year - 51}-12-31`];
    case "senior":
      return ["1900-01-01", `${year - 65}-12-31`];
  }
}
