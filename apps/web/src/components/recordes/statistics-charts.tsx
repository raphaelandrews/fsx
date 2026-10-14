import { barX, barY, defineChart, group, stack } from "@tanstack/charts";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";
import { scaleBand, scaleLinear } from "d3-scale";

import { formatShare } from "@/lib/format-share";

type RatingThreshold = {
  threshold: number;
  classic: number;
  rapid: number;
  blitz: number;
};

type TournamentTier = {
  tier: string;
  tournaments: number;
};

const number = new Intl.NumberFormat("pt-BR");

const FORMAT_SERIES = [
  { id: "classic", label: "Clássico", color: "var(--chart-1)", swatch: "bg-chart-1" },
  { id: "rapid", label: "Rápido", color: "var(--chart-2)", swatch: "bg-chart-2" },
  { id: "blitz", label: "Blitz", color: "var(--chart-3)", swatch: "bg-chart-3" },
] as const;

const TIER_ORDER = ["S", "A", "B", "school"] as const;

const TIER_PRESENTATION: Record<string, { label: string; color: string; swatch: string }> = {
  S: { label: "Tier S", color: "var(--chart-1)", swatch: "bg-chart-1" },
  A: { label: "Tier A", color: "var(--chart-4)", swatch: "bg-chart-4" },
  B: { label: "Tier B", color: "var(--chart-3)", swatch: "bg-chart-3" },
  school: { label: "Escolar", color: "var(--chart-6)", swatch: "bg-chart-6" },
};

function RatingThresholdChart({ ratings }: { ratings: RatingThreshold[] }) {
  const data = ratings.flatMap((row) =>
    FORMAT_SERIES.map(({ id, label }) => ({
      threshold: `${row.threshold}+`,
      format: label,
      players: row[id],
    })),
  );
  const chart = defineChart({
    marks: [
      barY(data, {
        x: "threshold",
        y: "players",
        color: "format",
        layout: group({ padding: 0.12 }),
        radius: 4,
      }),
    ],
    x: {
      scale: () => scaleBand().padding(0.2),
      axis: { line: false, ticks: { size: 0, padding: 8 } },
    },
    y: {
      scale: scaleLinear,
      nice: true,
      grid: true,
      axis: { line: false, ticks: { size: 0, padding: 8, format: (value) => number.format(Number(value)) } },
    },
    color: {
      domain: FORMAT_SERIES.map(({ label }) => label),
      range: FORMAT_SERIES.map(({ color }) => color),
    },
    tooltip: {
      use: tooltip,
      format: (point) => `${point.datum.format} · rating ${point.datum.threshold}: ${number.format(point.datum.players)} jogadores`,
    },
  });

  return (
    <figure className="min-w-0 rounded-2xl border bg-background p-4">
      <figcaption>
        <h2 className="font-semibold text-base">Jogadores ativos por faixa de rating</h2>
        <p className="text-muted-foreground text-sm">Compare os três formatos em cada limite.</p>
        <ul aria-label="Formatos de rating" className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
          {FORMAT_SERIES.map((series) => (
            <li className="flex items-center gap-2 text-sm" key={series.id}>
              <span aria-hidden="true" className={`size-2.5 rounded-full ${series.swatch}`} />
              {series.label}
            </li>
          ))}
        </ul>
      </figcaption>
      <Chart
        definition={chart}
        height={240}
        ariaLabel="Jogadores ativos por faixa de rating e formato"
        className="mt-2 w-full text-muted-foreground"
      />
      <p className="mt-2 text-muted-foreground text-xs">
        Baseado no ranking Absoluto, que inclui também as jogadoras do Feminino.
      </p>
    </figure>
  );
}

function TournamentTierChart({ tiers }: { tiers: TournamentTier[] }) {
  const chartData = tiers
    .filter(({ tournaments }) => tournaments > 0)
    .map(({ tier, tournaments }) => ({ tier, category: "Torneios", tournaments }));
  const total = chartData.reduce((sum, row) => sum + row.tournaments, 0);

  if (total === 0) {
    return (
      <figure className="min-w-0 rounded-2xl border bg-background p-4">
        <figcaption>
          <h2 className="font-semibold text-base">Torneios por nível</h2>
          <p className="text-muted-foreground text-sm">Distribuição proporcional dos torneios cadastrados.</p>
        </figcaption>
        <p className="mt-4 rounded-lg bg-muted p-3 text-muted-foreground text-sm">
          Ainda não há torneios cadastrados.
        </p>
      </figure>
    );
  }

  const chart = defineChart({
    marks: [
      barX(chartData, {
        x: "tournaments",
        y: "category",
        color: "tier",
        layout: stack({ order: TIER_ORDER, offset: "normalize" }),
        radius: 4,
      }),
    ],
    x: { scale: scaleLinear, axis: false },
    y: { scale: () => scaleBand().padding(0.25), axis: false },
    color: {
      domain: TIER_ORDER,
      range: TIER_ORDER.map((tier) => TIER_PRESENTATION[tier]!.color),
    },
    tooltip: {
      use: tooltip,
      format: (point) => {
        const share = point.datum.tournaments / total;
        return `${TIER_PRESENTATION[point.datum.tier]?.label ?? point.datum.tier}: ${number.format(point.datum.tournaments)} (${formatShare(share)})`;
      },
    },
    margin: { top: 8, right: 2, bottom: 8, left: 2 },
  });

  return (
    <figure className="min-w-0 rounded-2xl border bg-background p-4">
      <figcaption>
        <h2 className="font-semibold text-base">Torneios por nível</h2>
        <p className="text-muted-foreground text-sm">Uma barra representa 100% dos torneios cadastrados.</p>
      </figcaption>
      <Chart
        definition={chart}
        height={76}
        ariaLabel={`Distribuição proporcional de ${number.format(total)} torneios por nível`}
        className="mt-2 w-full text-muted-foreground"
      />
      <ul aria-label="Torneios por nível" className="mt-2 grid gap-2">
        {TIER_ORDER.map((tier) => {
          const presentation = TIER_PRESENTATION[tier]!;
          const tournaments = chartData.find((row) => row.tier === tier)?.tournaments ?? 0;
          const share = tournaments / total;
          return (
            <li className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2" key={tier}>
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className={`size-2.5 shrink-0 rounded-full ${presentation.swatch}`}
                />
                <span className="truncate">{presentation.label}</span>
              </span>
              <span className="shrink-0 font-medium text-sm tabular-nums">
                {number.format(tournaments)} <span className="text-muted-foreground">({formatShare(share)})</span>
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

export function StatisticsCharts({
  ratingsByThreshold,
  tournamentsByTier,
}: {
  ratingsByThreshold: RatingThreshold[];
  tournamentsByTier: TournamentTier[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <RatingThresholdChart ratings={ratingsByThreshold} />
      <TournamentTierChart tiers={tournamentsByTier} />
    </div>
  );
}
