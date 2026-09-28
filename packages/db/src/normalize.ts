// Lowercase + strip diacritics so name search can match without per-row
// SQL replace() chains. Used at write time (players.normalizedName) and for
// the incoming query, so both sides always use the exact same transform.
export function normalizeName(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ç/g, "c")
    .trim();
}
