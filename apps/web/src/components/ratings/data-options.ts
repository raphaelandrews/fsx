// Filter options for the /ratings page. Values must match the strings the
// backend's `players.withFilters` query filters on:
//   - titles  → `titles.shortName`  (FSX chess codes)
//   - clubs  → `clubs.name`
//   - locations → `locations.name`
//   - groups  → birth-date range key (handled server-side in
//     `getBirthDateRange`)
//
// Sex options use the new schema values (`male` / `female`) — the new
// app's backend accepts these strings directly, unlike the legacy source
// project which used `"true"` / `"false"`.

export const ratingTitles = [
  { value: "GMS", label: "GMS" },
  { value: "MSE", label: "MSE" },
  { value: "CMS", label: "CMS" },
  { value: "MFS", label: "MFS" },
  { value: "MSHC", label: "MSHC" },
  { value: "MJS", label: "MJS" },
  { value: "MMS", label: "MMS" },
  { value: "MN", label: "MN" },
  { value: "CM", label: "CM" },
] as const

export const ratingSexes = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Feminino" },
] as const

export const ratingGroups = [
  { value: "sub-8", label: "Sub 8" },
  { value: "sub-10", label: "Sub 10" },
  { value: "sub-12", label: "Sub 12" },
  { value: "sub-14", label: "Sub 14" },
  { value: "sub-16", label: "Sub 16" },
  { value: "sub-18", label: "Sub 18" },
  { value: "master", label: "Master" },
  { value: "veterano", label: "Veterano" },
  { value: "senior", label: "Sênior" },
] as const

export const ratingSortLabels: Record<"classic" | "rapid" | "blitz", string> = {
  classic: "Clássico",
  rapid: "Rápido",
  blitz: "Blitz",
}
