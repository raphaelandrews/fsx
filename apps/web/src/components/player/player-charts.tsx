import { barY, d3Curve, defineChart, lineY } from "@tanstack/charts"
import { tooltip } from "@tanstack/charts/tooltip"
import { Chart } from "@tanstack/react-charts"
import { scaleBand, scaleLinear } from "d3-scale"
import { curveMonotoneX } from "d3-shape"

interface PlayerById {
  id: number
  playersToTournaments?: Array<{
    variation: number
    oldRating: number
    tournament: {
      name: string
      ratingType: string
    }
  }>
}

const getFillColorVariation = (
  variation: number,
  isHighest: boolean
) => {
  if (isHighest && variation > 0) {
    return "var(--chart-2)"
  }

  if (variation < 0) {
    return "var(--chart-3)"
  }

  return "var(--chart-4)"
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
  )
}

const extractTotalRatingData = (
  player: PlayerById,
  selectedRatingType: string
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
  )
}

export function VariationChart({
  player,
  selectedRatingType,
}: {
  player: PlayerById
  selectedRatingType: string
}) {
  const chartData = extractChartData(player, selectedRatingType)

  if (chartData.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground text-sm border rounded-md bg-muted/20">
        Nenhum dado de variação disponível para este tipo de rating.
      </div>
    )
  }

  const maxVariation = Math.max(...chartData.map((entry) => entry.variation))
  const hasPositiveVariations = maxVariation > 0

  const variationChart = defineChart({
    marks: [
      barY(chartData, {
        x: "name",
        y: "variation",
        fill: (d) =>
          getFillColorVariation(
            d.variation,
            hasPositiveVariations && d.variation === maxVariation
          ),
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
  })

  return (
    <Chart
      definition={variationChart}
      height={200}
      ariaLabel="Variação de rating"
      className="w-full text-muted-foreground"
    />
  )
}

export function TotalRatingChart({
  player,
  selectedRatingType,
}: {
  player: PlayerById
  selectedRatingType: string
}) {
  const chartData = extractTotalRatingData(player, selectedRatingType)

  if (chartData.length === 0) {
    return <div />
  }

  const ratingChart = defineChart({
    marks: [
      lineY(chartData, {
        x: "name",
        y: "totalRating",
        stroke: "var(--chart-1)",
        strokeWidth: 2,
        curve: d3Curve(curveMonotoneX),
        points: true,
      }),
    ],
    x: { scale: () => scaleBand().padding(0.2), axis: false },
    y: { scale: scaleLinear, nice: true, grid: true },
    tooltip: {
      use: tooltip,
      format: (point) => `${point.datum.name}: ${point.datum.totalRating}`,
    },
  })

  return (
    <Chart
      definition={ratingChart}
      height={200}
      ariaLabel="Evolução do rating"
      className="w-full text-muted-foreground"
    />
  )
}
