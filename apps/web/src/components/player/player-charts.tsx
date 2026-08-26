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
  isHighest: boolean,
  isLowest: boolean
) => {
  if (isHighest && variation > 0) {
    return "var(--chart-5)"
  }

  if (isLowest && variation < 0) {
    return "var(--chart-6)"
  }

  if (variation < -20) {
    return "var(--chart-3)"
  }
  if (variation < 0) {
    return "var(--chart-4)"
  }
  if (variation >= 20) {
    return "var(--chart-1)"
  }
  return "var(--chart-2)"
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
  const minVariation = Math.min(...chartData.map((entry) => entry.variation))
  const hasPositiveVariations = maxVariation > 0
  const hasNegativeVariations = minVariation < 0

  const variationChart = defineChart({
    marks: [
      barY(chartData, {
        x: "name",
        y: "variation",
        fill: (d) =>
          getFillColorVariation(
            d.variation,
            hasPositiveVariations && d.variation === maxVariation,
            hasNegativeVariations && d.variation === minVariation
          ),
        radius: 4,
      }),
    ],
    x: { scale: () => scaleBand().padding(0.2) },
    y: { scale: scaleLinear, nice: true, grid: true },
    tooltip,
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
    x: { scale: () => scaleBand().padding(0.2) },
    y: { scale: scaleLinear, nice: true, grid: true },
    tooltip,
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
