import { slugify } from "@/utils/slugify";

type ListedCircuit = { id: number; name: string; year: number | null };

// Shared by the /circuitos loader, head, and component so all three resolve
// the same circuit. A `circuito` slug without `ano` (old links) picks the
// circuit's own season.
export function selectSeason<T extends ListedCircuit>(
  circuits: T[],
  search: { ano?: number; circuito?: string },
) {
  const years = [...new Set(circuits.flatMap((circuit) => (circuit.year == null ? [] : [circuit.year])))].sort(
    (a, b) => b - a,
  );
  const bySlug = search.circuito
    ? circuits.find((circuit) => slugify(circuit.name) === search.circuito)
    : undefined;
  const year =
    search.ano !== undefined && years.includes(search.ano) ? search.ano : (bySlug?.year ?? years[0]);
  const season = years.length === 0 ? circuits : circuits.filter((circuit) => circuit.year === year);
  const selected = (bySlug && season.includes(bySlug) ? bySlug : undefined) ?? season[0];
  return { years, year, season, selected };
}
