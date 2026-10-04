import type { ReactNode } from "react";

import { cn } from "@fsx/ui/lib/utils";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const shade = (count: number) =>
  count === 0 ? "bg-muted" : count === 1 ? "bg-primary/35" : count === 2 ? "bg-primary/65" : "bg-primary";

export interface HeatmapRow {
  year: number;
  months: number[];
  label?: ReactNode;
}

// Tournaments per month: one row per year, a cell per month.
export function ActivityHeatmap({ rows }: { rows: HeatmapRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-separate border-spacing-1 text-xs">
        <caption className="sr-only">Torneios por mês</caption>
        <thead>
          <tr>
            <th scope="col" className="sr-only">
              Ano
            </th>
            {MONTHS.map((month) => (
              <th key={month} scope="col" className="font-normal text-muted-foreground">
                {month}
              </th>
            ))}
            <th scope="col" className="pl-1 text-right font-normal text-muted-foreground">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.year}>
              <th scope="row" className="pr-1 text-left font-medium tabular-nums">
                {row.label ?? row.year}
              </th>
              {row.months.map((count, month) => (
                <td key={MONTHS[month]} className={cn("h-5 min-w-5 rounded-sm", shade(count))}>
                  <span className="sr-only">
                    {count} {count === 1 ? "torneio" : "torneios"} em {MONTHS[month]}
                  </span>
                </td>
              ))}
              <td className="pl-1 text-right tabular-nums">{row.months.reduce((sum, count) => sum + count, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Dates are plain YYYY-MM-DD; read as text, not through Date, so no time-zone shift.
export function heatmapRows(dates: (string | null)[]): HeatmapRow[] {
  const years = new Map<number, number[]>();
  for (const date of dates) {
    if (!date) continue;
    const year = Number(date.slice(0, 4));
    const months = years.get(year) ?? Array.from({ length: 12 }, () => 0);
    months[Number(date.slice(5, 7)) - 1]!++;
    years.set(year, months);
  }
  return [...years].sort(([a], [b]) => b - a).map(([year, months]) => ({ year, months }));
}
