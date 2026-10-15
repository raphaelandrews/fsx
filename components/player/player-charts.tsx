"use strict";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Cell,
  LabelList,
  YAxis,
  LineChart,
  Line,
} from "recharts";

import type { PlayerById } from "@/db/queries";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const getFillColorVariation = (
  variation: number,
  isHighest: boolean,
  isLowest: boolean
) => {
  if (isHighest && variation > 0) {
    return "var(--chart-5)";
  }

  if (isLowest && variation < 0) {
    return "var(--chart-6)";
  }

  if (variation < -20) {
    return "var(--chart-3)";
  }
  if (variation < 0) {
    return "var(--chart-4)";
  }
  if (variation >= 20) {
    return "var(--chart-1)";
  }
  return "var(--chart-2)";
};

const chartConfig = {
  variation: {
    label: "Variação",
    color: "var(--chart-5)",
  },
  totalRating: {
    label: "Evolução do rating",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

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
      })) || []
  );
};

const extractTotalRatingData = (
  player: PlayerById,
  selectedRatingType: string
) => {
  let previousTotalRating: number | null = null;
  return (
    player.playersToTournaments
      ?.filter((ptt) => ptt.tournament.ratingType === selectedRatingType)
      .reverse()
      .slice(0, 12)
      .reverse()
      .map((ptt) => {
        const totalRating = ptt.oldRating + ptt.variation;
        const previousTotalRatingCopy = previousTotalRating;
        previousTotalRating = totalRating;
        return {
          name: ptt.tournament.name,
          totalRating,
          previousTotalRating: previousTotalRatingCopy,
        };
      }) || []
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

  const maxVariation = Math.max(
    ...chartData.map((entry: { variation: number }) => entry.variation)
  );
  const minVariation = Math.min(
    ...chartData.map((entry: { variation: number }) => entry.variation)
  );

  const hasPositiveVariations = maxVariation > 0;
  const hasNegativeVariations = minVariation < 0;

  return (
    <ChartContainer className="min-h-[200px] w-full" config={chartConfig}>
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 24,
        }}
      >
        <CartesianGrid
          vertical={false}
          strokeDasharray="3 3"
          className="stroke-muted"
        />
        <XAxis
          axisLine={false}
          dataKey="name"
          tickFormatter={(value) => value.slice(0, 0)}
          tickLine={false}
          tickMargin={10}
        />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <ChartLegend content={<ChartLegendContent className="-mt-6" />} />
        <Bar dataKey="variation" fill="var(--chart-5)" radius={[4, 4, 0, 0]}>
          {chartData.map((entry: { name: string; variation: number }) => (
            <Cell
              fill={getFillColorVariation(
                entry.variation,
                hasPositiveVariations && entry.variation === maxVariation,
                hasNegativeVariations && entry.variation === minVariation
              )}
              key={`${entry.name}-${entry.variation}`}
            />
          ))}
          <LabelList
            className="fill-foreground font-medium"
            fontSize={12}
            offset={12}
            position="top"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
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

  return (
    <ChartContainer
      className="-translate-x-2 mt-4 min-h-[200px] w-full"
      config={chartConfig}
    >
      <LineChart
        data={chartData}
        margin={{
          top: 24,
          left: 4,
          right: 16,
        }}
      >
        <CartesianGrid
          key="cartesian-grid"
          vertical={false}
          strokeDasharray="3 3"
          className="stroke-muted"
        />
        <XAxis
          axisLine={false}
          dataKey="name"
          key="x-axis"
          tickFormatter={(value) => value.slice(0, 0)}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis
          axisLine={false}
          domain={["auto", "auto"]}
          key="y-axis"
          tickLine={false}
          width={40}
          tick={{ fontSize: 12 }}
        />
        <ChartTooltip
          content={<ChartTooltipContent indicator="line" />}
          cursor={false}
          key="chart-tooltip"
        />
        <ChartLegend
          content={<ChartLegendContent className="-mt-6" />}
          key="chart-legend"
        />
        <Line
          activeDot={{
            r: 6,
            className: "fill-primary",
          }}
          dataKey="totalRating"
          dot={(props) => {
            return (
              <circle
                cx={props.cx}
                cy={props.cy}
                fill="var(--chart-1)"
                key={`dot-${props.cx}-${props.cy}`}
                r={4}
                stroke="none"
              />
            );
          }}
          key="total-rating-line"
          stroke="var(--chart-1)"
          strokeWidth={2}
          type="monotone"
        >
          <LabelList
            className="fill-foreground font-medium"
            fontSize={12}
            key="label-list"
            offset={12}
            position="top"
          />
        </Line>
      </LineChart>
    </ChartContainer>
  );
}
