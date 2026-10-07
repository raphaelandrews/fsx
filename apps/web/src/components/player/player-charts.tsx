import { areaY, barY, d3Curve, defineChart, lineY } from "@tanstack/charts";
import { tooltip } from "@tanstack/charts/tooltip";
import { Chart } from "@tanstack/react-charts";
import { scaleBand, scaleLinear } from "d3-scale";
import { curveMonotoneX } from "d3-shape";

interface PlayerById {
  id: number;
  playersToTournaments?: Array<{
    variation: number;
    oldRating: number;
    tournament: {
      name: string;
      ratingType: string;
    };
  }>;
}

function extractVariationData(player: PlayerById, selectedRatingType: string) {
  return (
    player.playersToTournaments
      ?.filter((ptt) => ptt.tournament.ratingType === selectedRatingType)
      .reverse()
      .slice(0, 12)
      .reverse()
      .map((ptt) => ({
        name: ptt.tournament.name,
        variation: ptt.variation,
      })) ?? []
  );
}

function extractTotalRatingData(player: PlayerById, selectedRatingType: string) {
  return (
    player.playersToTournaments
      ?.filter((ptt) => ptt.tournament.ratingType === selectedRatingType)
      .reverse()
      .slice(0, 12)
      .reverse()
      .map((ptt) => ({
        name: ptt.tournament.name,
        totalRating: ptt.oldRating + ptt.variation,
      })) ?? []
  );
}

function ChartEmpty({ title, message }: { title: string; message: string }) {
  return (
    <figure className="min-w-0 rounded-2xl border bg-background p-4">
      <figcaption className="font-semibold text-base">{title}</figcaption>
      <p className="mt-4 rounded-lg bg-muted p-3 text-center text-muted-foreground text-sm">{message}</p>
    </figure>
  );
}

export function VariationChart({
  player,
  selectedRatingType,
}: {
  player: PlayerById;
  selectedRatingType: string;
}) {
  const chartData = extractVariationData(player, selectedRatingType);

  if (chartData.length === 0) {
    return <ChartEmpty title="Variação de rating" message="Nenhum dado de variação disponível para este formato." />;
  }

  const maxVariation = Math.max(...chartData.map((entry) => entry.variation));
  const hasPositiveVariations = maxVariation > 0;
  const variationChart = defineChart({
    marks: [
      barY(chartData, {
        x: "name",
        y: "variation",
        fill: (d) => {
          if (hasPositiveVariations && d.variation === maxVariation) return "var(--chart-2)";
          if (d.variation < 0) return "var(--destructive-fill)";
          return "var(--chart-1)";
        },
        radius: 4,
      }),
    ],
    x: { scale: () => scaleBand().padding(0.2), axis: false },
    y: { scale: scaleLinear, nice: true, grid: true },
    tooltip: {
      use: tooltip,
      format: (point) =>
        `${point.datum.name}: ${point.datum.variation > 0 ? "+" : ""}${point.datum.variation}`,
    },
  });

  return (
    <figure className="min-w-0 rounded-2xl border bg-background p-4">
      <figcaption>
        <h3 className="font-semibold text-base">Variação de rating</h3>
        <p className="text-muted-foreground text-sm">Até 12 torneios recentes no formato selecionado.</p>
      </figcaption>
      <Chart
        definition={variationChart}
        height={220}
        ariaLabel="Variação de rating nos torneios recentes"
        className="mt-2 w-full text-muted-foreground"
      />
    </figure>
  );
}

export function TotalRatingChart({
  player,
  selectedRatingType,
}: {
  player: PlayerById;
  selectedRatingType: string;
}) {
  const chartData = extractTotalRatingData(player, selectedRatingType);

  if (chartData.length === 0) {
    return <ChartEmpty title="Evolução de rating" message="Nenhum dado de rating disponível para este formato." />;
  }

  const ratings = chartData.map(({ totalRating }) => totalRating);
  const minRating = Math.min(...ratings);
  const maxRating = Math.max(...ratings);
  const padding = Math.max(20, (maxRating - minRating) * 0.15);
  const yMin = Math.max(0, minRating - padding);
  const yMax = maxRating + padding;
  const curve = d3Curve(curveMonotoneX);
  const ratingChart = defineChart({
    marks: [
      areaY(chartData, {
        x: "name",
        y: "totalRating",
        y1: yMin,
        fill: "var(--chart-1)",
        fillOpacity: 0.1,
        curve,
      }),
      lineY(chartData, {
        x: "name",
        y: "totalRating",
        stroke: "var(--chart-1)",
        strokeWidth: 2,
        curve,
        points: true,
      }),
    ],
    x: { scale: () => scaleBand().padding(0.2), axis: false },
    y: { scale: () => scaleLinear().domain([yMin, yMax]), grid: true },
    tooltip: {
      use: tooltip,
      format: (point) => `${point.datum.name}: ${point.datum.totalRating}`,
    },
  });

  return (
    <figure className="min-w-0 rounded-2xl border bg-background p-4">
      <figcaption>
        <h3 className="font-semibold text-base">Evolução de rating</h3>
        <p className="text-muted-foreground text-sm">Rating após cada torneio recente no formato selecionado.</p>
      </figcaption>
      <Chart
        definition={ratingChart}
        height={220}
        ariaLabel="Evolução do rating nos torneios recentes"
        className="mt-2 w-full text-muted-foreground"
      />
    </figure>
  );
}
