export const formatArchiveDate = (isoDate: string) => isoDate.split("-").reverse().join("/");

export const RHYTHM_TABS = [
  { value: "classic", label: "Clássico" },
  { value: "rapid", label: "Rápido" },
  { value: "blitz", label: "Blitz" },
] as const;
