import { barY, defineChart, lineY } from "@tanstack/charts";
import { Chart } from "@tanstack/react-charts";
import { scaleBand, scaleLinear } from "d3-scale";

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

const extractChartData = (player: PlayerById, selectedRatingType: string) => {
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
};

const extractTotalRatingData = (
  player: PlayerById,
  selectedRatingType: string,
) => {
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
};

export function VariationChart({
  player,
  selectedRatingType,
}: {
  player: PlayerById;
  selectedRatingType: string;
}) {
  const chartData = extractChartData(player, selectedRatingType);

  if (chartData.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm border border-dashed rounded-md bg-muted/20">
        Nenhum dado de variação disponível para este tipo de rating.
      </div>
    );
  }

  // @ts-expect-error TanStack Charts v0.x types are strict — runtime API is correct
  const variationChart = defineChart({
    marks: [
      ((barY as any)(chartData, {
        x: "name",
        y: "variation",
      })),
    ],
    x: { scale: () => scaleBand().padding(0.2) },
    y: { scale: scaleLinear, nice: true, grid: true },
    tooltip: true,
  });

  return (
    <Chart
      definition={variationChart}
      height={200}
      ariaLabel="Variação de rating"
      className="w-full"
    />
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
    return <div />;
  }

  // @ts-expect-error TanStack Charts v0.x types are strict — runtime API is correct
  const ratingChart = defineChart({
    marks: [
      ((lineY as any)(chartData, {
        x: "name",
        y: "totalRating",
      })),
    ],
    x: { scale: () => scaleBand().padding(0.2) },
    y: { scale: scaleLinear, nice: true, grid: true },
    tooltip: true,
  });

  return (
    <Chart
      definition={ratingChart}
      height={200}
      ariaLabel="Evolução do rating"
      className="w-full"
    />
  );
}
