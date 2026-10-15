import { useState, type PointerEvent, type ReactNode } from "react";

import { cn } from "@fsx/ui/lib/utils";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const LEVELS = ["bg-muted", "bg-primary/50", "bg-primary/75", "bg-primary"] as const;
const levelOf = (count: number) => Math.min(count, LEVELS.length - 1);
const plural = (count: number) => `${count} ${count === 1 ? "torneio" : "torneios"}`;

// Tournaments per month by year. Dates are plain YYYY-MM-DD, read as text rather
// than through Date, so server and client never disagree about the month.
export function monthlyCounts(dates: (string | null)[]) {
  const years = new Map<number, number[]>();
  for (const date of dates) {
    if (!date) continue;
    const year = Number(date.slice(0, 4));
    const months = years.get(year) ?? Array.from({ length: 12 }, () => 0);
    months[Number(date.slice(5, 7)) - 1]!++;
    years.set(year, months);
  }
  return years;
}

// A row of month squares per year, newest first; hovering a square shows its count.
export function ActivityGraph({
  dates,
  years,
  yearLabel = (year) => year,
}: {
  dates: (string | null)[];
  years?: number[];
  yearLabel?: (year: number) => ReactNode;
}) {
  const counts = monthlyCounts(dates);
  const rows = (years ?? [...counts.keys()].sort((a, b) => b - a)).map((year) => ({
    year,
    months: counts.get(year) ?? Array.from({ length: 12 }, () => 0),
  }));
  const total = rows.reduce((sum, row) => sum + row.months.reduce((a, b) => a + b, 0), 0);
  // One tooltip for the whole graph: a Base UI tooltip per square added ~190
  // bytes of markup each, which a long career multiplies by hundreds.
  const [tip, setTip] = useState<{ label: string; x: number; y: number } | null>(null);
  const showTip = (event: PointerEvent<HTMLElement>) => {
    const cell = (event.target as HTMLElement).closest<HTMLElement>("[data-tip]");
    const figure = event.currentTarget.getBoundingClientRect();
    if (!cell) return setTip(null);
    const box = cell.getBoundingClientRect();
    setTip({ label: cell.dataset.tip!, x: box.left - figure.left + box.width / 2, y: box.top - figure.top });
  };

  return (
    <figure className="relative flex w-full flex-col gap-2" onPointerOver={showTip} onPointerLeave={() => setTip(null)}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[300px] table-fixed border-separate border-spacing-[3px] text-[10px]">
          <caption className="sr-only">Torneios por mês</caption>
          <thead>
            <tr>
              {/* Not sr-only: a fixed table takes its column widths from this row. */}
              <th scope="col" className="w-10">
                <span className="sr-only">Ano</span>
              </th>
              {MONTHS.map((month) => (
                <th key={month} scope="col" className="font-normal text-muted-foreground">
                  {month}
                </th>
              ))}
              <th scope="col" className="w-10 pl-1 text-right font-normal text-muted-foreground">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.year}>
                <th scope="row" className="pr-1 text-left font-medium text-xs tabular-nums">
                  {yearLabel(row.year)}
                </th>
                {row.months.map((count, month) => (
                  <td key={MONTHS[month]} className="p-0">
                    <span
                      aria-hidden
                      data-tip={`${MONTH_NAMES[month]} de ${row.year}: ${count ? plural(count) : "nenhum torneio"}`}
                      className={cn("block h-6 w-full rounded-[5px]", LEVELS[levelOf(count)])}
                    />
                    {count > 0 && <span className="sr-only">{plural(count)}</span>}
                  </td>
                ))}
                <td className="pl-1 text-right text-xs tabular-nums">{row.months.reduce((a, b) => a + b, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground text-xs">
        <span>{plural(total)}</span>
        <span className="flex items-center gap-1" aria-hidden>
          Menos
          {LEVELS.map((level) => (
            <span key={level} className={cn("size-[10px] rounded-[2px]", level)} />
          ))}
          Mais
        </span>
      </figcaption>
      {tip && (
        <span
          aria-hidden
          className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-[calc(100%+6px)] whitespace-nowrap rounded-md bg-foreground px-3 py-1.5 text-background text-xs"
          style={{ left: tip.x, top: tip.y }}
        >
          {tip.label}
        </span>
      )}
    </figure>
  );
}
