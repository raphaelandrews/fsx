const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export const monthName = (month: number) => MONTHS[month - 1]!;
export const monthShort = (month: number) => MONTHS[month - 1]!.slice(0, 3);

const dayOf = (isoDate: string) => isoDate.slice(0, 10);

export function eventPeriod(startDate: string, endDate: string | null) {
  const start = dayOf(startDate);
  const end = endDate ? dayOf(endDate) : null;
  const [, startMonth, startDay] = start.split("-").map(Number) as [number, number, number];
  if (!end || end === start) return `${startDay} de ${monthName(startMonth)}`;
  const [, endMonth, endDay] = end.split("-").map(Number) as [number, number, number];
  return startMonth === endMonth
    ? `${startDay} a ${endDay} de ${monthName(endMonth)}`
    : `${startDay} de ${monthName(startMonth)} a ${endDay} de ${monthName(endMonth)}`;
}

export const isFinished = (endDate: string | null, startDate: string, today: string) => dayOf(endDate ?? startDate) < today;

/** Groups by "YYYY-MM". With `year`, an event that began in an earlier year is listed under January. */
export function groupByMonthOfYear<T extends { startDate: string }>(events: T[], year?: number) {
  const groups = new Map<string, T[]>();
  for (const event of events) {
    const day = dayOf(event.startDate);
    const key = year !== undefined && Number(day.slice(0, 4)) < year ? `${year}-01` : day.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.entries()];
}
