import * as React from "react"

import { ExternalLink, VerifiedIcon } from "lucide-react"
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
} from "recharts"

import type { PlayerById } from "@/db/queries"
import { FormatPodium, FormatPodiumTitle } from "@/lib/format-podium"
import { getGradient } from "@/lib/generate-gradients"
import { LOGO_FALLBACK } from "@/lib/utils"

import { columns } from "./columns"
import { DataTable } from "./data-table"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"
import { playerByIdQueryOptions } from "@/lib/client-queries/player-by-id/query-options"

export const PlayerSheet = ({
	id,
	open,
	setOpen,
}: {
	id: number
	open: boolean
	setOpen: (open: boolean) => void
}) => {
	const [selectedRatingType, setSelectedRatingType] = React.useState("rapid")

	const headerGradient = getGradient(id)
	const avatarGradient = getGradient(id + 1)

	const {
		data: player,
		isLoading,
		isError,
		error,
	} = useQuery(playerByIdQueryOptions(Number(id)))

	const orderPodiums = React.useMemo(() => {
		return player?.tournamentPodiums
			? [...player.tournamentPodiums].reverse()
			: []
	}, [player?.tournamentPodiums])

	const tournaments = React.useMemo(() => {
		return player?.playersToTournaments
			? [...player.playersToTournaments].reverse()
			: []
	}, [player?.playersToTournaments])

	const managementRole = React.useMemo(() => {
		return player?.playersToRoles?.find(
			(role: { role: { type: string } }) => role.role.type === "management"
		)
	}, [player?.playersToRoles])

	const refereeRole = React.useMemo(() => {
		return player?.playersToRoles?.find(
			(role: { role: { type: string } }) => role.role.type === "referee"
		)
	}, [player?.playersToRoles])

	const internalTitle = React.useMemo(() => {
		return player?.playersToTitles?.find(
			(title: { title: { type: string } }) => title.title.type === "internal"
		)
	}, [player?.playersToTitles])

	const externalTitle = React.useMemo(() => {
		return player?.playersToTitles?.find(
			(title: { title: { type: string } }) => title.title.type === "external"
		)
	}, [player?.playersToTitles])

	if (isLoading) {
		// Use isLoading from useQuery
		return (
			<Sheet onOpenChange={setOpen} open={open}>
				<SheetContent className="gap-0 overflow-y-auto overflow-x-hidden [&>button#close-sheet]:top-1 [&>button#close-sheet]:right-1">
					<div className="flex h-full flex-col items-center justify-center">
						<Skeleton className="mb-4 h-20 w-20 rounded-full" />
						<Skeleton className="mb-2 h-6 w-48" />
						<Skeleton className="h-4 w-32" />
					</div>
				</SheetContent>
			</Sheet>
		)
	}

	if (isError) {
		// Handle error state
		return (
			<Sheet onOpenChange={setOpen} open={open}>
				<SheetContent className="gap-0 overflow-y-auto overflow-x-hidden [&>button#close-sheet]:top-1 [&>button#close-sheet]:right-1">
					<div className="flex h-full flex-col items-center justify-center text-red-500">
						<p>
							Error loading player data: {error?.message || "Unknown error"}
						</p>
					</div>
				</SheetContent>
			</Sheet>
		)
	}

	if (!player) {
		// This case should ideally not be hit if isLoading and isError are handled, but good for type safety
		return null
	}

	return (
		<Sheet onOpenChange={setOpen} open={open}>
			<SheetContent className="!w-[400px] sm:!w-[540px] !max-w-[90%] sm:!max-w-[480px] gap-0 overflow-y-auto overflow-x-hidden p-4 [&>button#close-sheet]:top-2.5 [&>button#close-sheet]:right-2.5">
				<SheetHeader className="px-0 pt-0">
					<div className="relative mb-12">
						<div className="h-32 w-full rounded-md" style={headerGradient} />
						<Avatar className="-translate-y-1/2 -translate-x-1/2 absolute left-1/2 h-20 w-20 rounded-[10px] border-4 border-background">
							<AvatarImage
								alt={player.name}
								src={player.imageUrl ?? undefined}
							/>
							<AvatarFallback style={avatarGradient} />
						</Avatar>
					</div>
					<div className="flex items-center justify-center gap-1">
						<SheetTitle className="mt-1 text-center">
							{internalTitle && (
								<span className="text-gold">
									{internalTitle.title.shortTitle}{" "}
								</span>
							)}
							{player.nickname ? player.nickname : player.name}
						</SheetTitle>
						{player.verified && (
							<Popover>
								<PopoverTrigger>
									<VerifiedIcon
										aria-label="Verificado"
										className="!fill-[#1CA0F2] mt-1 stroke-background dark:stroke-[1.5]"
									/>
								</PopoverTrigger>
								<PopoverContent>
									<p className="font-semibold text-primary">
										Perfil verificado
									</p>
								</PopoverContent>
							</Popover>
						)}
					</div>
				</SheetHeader>

				{(managementRole || refereeRole) && (
					<div className="mt-8 flex flex-col items-center justify-center gap-1.5">
						{managementRole && (
							<Badge variant="default">{managementRole.role.role}</Badge>
						)}
						{refereeRole && (
							<Badge variant="default">{refereeRole.role.role}</Badge>
						)}
					</div>
				)}

				{orderPodiums.length > 0 && (
					<div className="mt-8 flex flex-wrap justify-center gap-1.5">
						{orderPodiums.map((podium) => (
							<Popover key={podium.place + podium.tournament.name}>
								<PopoverTrigger className="rounded-md bg-primary-foreground/60 p-2 text-primary">
									{FormatPodium(
										podium.place,
										(podium.tournament.championshipId as number) || 0
									)}
								</PopoverTrigger>
								<PopoverContent className="max-w-72 text-center">
									{FormatPodiumTitle(podium.place)}{" "}
									{podium.tournament.name as string}
								</PopoverContent>
							</Popover>
						))}
					</div>
				)}

				{!(managementRole || refereeRole) && orderPodiums.length <= 0 && (
					<div className="pt-3" />
				)}

				<div className="mt-5">
					<Info content={player.name} label="Nome" />

					{internalTitle && (
						<Info label="Titulação">
							{internalTitle && <p>{internalTitle.title.title}</p>}
						</Info>
					)}

					{externalTitle && (
						<Info label="Titulação CBX/FIDE">
							{externalTitle && <p>{externalTitle.title.title}</p>}
						</Info>
					)}

					{player.club && player.club.name !== null && (
						<Info label="Clube">
							<div className="flex items-center gap-2">
								<Avatar className="size-4 rounded object-contain">
									<AvatarImage
										alt={player.club?.name as string}
										className="size-4 rounded object-contain"
										src={
											(player.club?.logo as string)
												? (player.club?.logo as string)
												: LOGO_FALLBACK
										}
										title={player.club?.name as string}
									/>
									<AvatarFallback className="size-4 rounded-none object-contain" />
								</Avatar>
								<p>{player.club.name as string}</p>
							</div>
						</Info>
					)}

					{player.location && player.location.name !== null && (
						<Info label="Local">
							<div className="flex items-center gap-2">
								<Avatar className="size-4 rounded object-contain">
									<AvatarImage
										alt={player.location?.name as string}
										className="size-4 rounded object-contain"
										src={
											(player.location?.flag as string)
												? (player.location?.flag as string)
												: LOGO_FALLBACK
										}
										title={player.location?.name as string}
									/>
									<AvatarFallback className="size-4 rounded-none object-contain" />
								</Avatar>
								<p>{player.location?.name as string}</p>
							</div>
						</Info>
					)}

					<Info label="Status">
						{player.active ? (
							<div className="flex items-center gap-2">
								<span className="relative flex h-2 w-2">
									<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
									<span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
								</span>
								<p>Ativo</p>
							</div>
						) : (
							<div className="flex items-center gap-2">
								<span className="relative flex h-2 w-2">
									<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
									<span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
								</span>
								<p>Inativo</p>
							</div>
						)}
					</Info>
				</div>

				<div className="mt-3">
					<Info label="Ratings" />
					<div className="grid grid-cols-3 gap-2">
						<RatingCard label="Clássico" rating={player.classic} />
						<RatingCard label="Rápido" rating={player.rapid} />
						<RatingCard label="Blitz" rating={player.blitz} />
					</div>

					<Info label="IDs" />
					<div className="grid grid-cols-3 gap-2">
						<RatingCard label="FSX" rating={player.id} />
						<RatingCard
							label="CBX"
							link={
								player.cbxId ? (
									<a
										className="flex justify-center text-primary transition hover:underline"
										href={`https://www.cbx.org.br/jogador/${player.cbxId}`}
										rel="noreferrer"
										target="_blank"
									>
										{player.cbxId} <ExternalLink className="ml-2 w-4" />
									</a>
								) : (
									<span>-</span>
								)
							}
						/>
						<RatingCard
							label="FIDE"
							link={
								player.fideId ? (
									<a
										className="flex justify-center text-primary transition hover:underline"
										href={`https://ratings.fide.com/profile/${player.fideId}`}
										rel="noreferrer"
										target="_blank"
									>
										{player.fideId} <ExternalLink className="ml-2 w-4" />
									</a>
								) : (
									<span>-</span>
								)
							}
						/>
					</div>
				</div>

				{tournaments.length > 0 && (
					<>
						<Info label="Performance" />
						<span className="text-xs">Últimos 12 torneios</span>
						<div className="flex justify-end">
							<Select
								onValueChange={(value) => setSelectedRatingType(value)}
								value={selectedRatingType}
							>
								<SelectTrigger className="mt-2 w-auto">
									<SelectValue placeholder="Selecione o tipo de rating" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="classic">Clássico</SelectItem>
									<SelectItem value="rapid">Rápido</SelectItem>
									<SelectItem value="blitz">Blitz</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="mt-2">
							<VariationChart
								player={{
									...player,
									active: player.active ?? false,
									verified: player.verified ?? false,
								}}
								selectedRatingType={selectedRatingType}
							/>
							<TotalRatingChart
								player={{
									...player,
									active: player.active ?? false,
									verified: player.verified ?? false,
								}}
								selectedRatingType={selectedRatingType}
							/>
						</div>
					</>
				)}

				{tournaments && (
					<div className="mt-3">
						<Info label="Torneios">
							<div className="w-full">
								<DataTable columns={columns} data={tournaments} />
							</div>
						</Info>
					</div>
				)}
			</SheetContent>
		</Sheet>
	)
}

const Info = ({
	label,
	content,
	children,
}: {
	label: string
	content?: string
	children?: React.ReactNode
}) => {
	return (
		<div>
			<h3 className="mt-3 text-muted-foreground text-sm">{label}</h3>
			{content && <p>{content}</p>}
			{children}
		</div>
	)
}

interface RatingCardProps {
	label: string
	rating?: number | null | undefined
	link?: React.ReactNode
}

const RatingCard = ({ label, rating, link }: RatingCardProps) => {
	return (
		<div className="mt-2 rounded-md bg-primary-foreground p-4 text-center">
			<p className="text-sm">{label}</p>
			<p className="mt-2 font-medium">{rating}</p>
			{link}
		</div>
	)
}

const extractChartData = (player: PlayerById, selectedRatingType: string) => {
	return (
		player.playersToTournaments
			?.filter(
				(tournament: { ratingType: string }) =>
					tournament.ratingType === selectedRatingType
			)
			.reverse()
			.slice(0, 12)
			.reverse()
			.map((tournament) => ({
				name: tournament.tournament.name,
				variation: tournament.variation,
			})) || []
	)
}

const extractTotalRatingData = (
	player: PlayerById,
	selectedRatingType: string
) => {
	let previousTotalRating: number | null = null
	return (
		player.playersToTournaments
			?.filter(
				(tournament: { ratingType: string }) =>
					tournament.ratingType === selectedRatingType
			)
			.reverse()
			.slice(0, 12)
			.reverse()
			.map((tournament) => {
				const totalRating = tournament.oldRating + tournament.variation
				const previousTotalRatingCopy = previousTotalRating
				previousTotalRating = totalRating
				return {
					name: tournament.tournament.name,
					totalRating,
					previousTotalRating: previousTotalRatingCopy,
				}
			}) || []
	)
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

const chartConfig = {
	variation: {
		label: "Variação",
		color: "var(--chart-5)",
	},
	totalRating: {
		label: "Evolução do rating",
		color: "var(--chart-5)",
	},
} satisfies ChartConfig

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
			<div className="mt-2 text-center text-muted-foreground text-sm">
				Nenhum dado de variação disponível para este tipo de rating.
			</div>
		)
	}

	const maxVariation = Math.max(
		...chartData.map((entry: { variation: number }) => entry.variation)
	)
	const minVariation = Math.min(
		...chartData.map((entry: { variation: number }) => entry.variation)
	)

	const hasPositiveVariations = maxVariation > 0
	const hasNegativeVariations = minVariation < 0

	return (
		<ChartContainer className="min-h-[200px] w-full" config={chartConfig}>
			<BarChart
				accessibilityLayer
				data={chartData}
				margin={{
					top: 24,
				}}
			>
				<CartesianGrid vertical={false} />
				<XAxis
					axisLine={false}
					dataKey="name"
					tickFormatter={(value) => value.slice(0, 0)}
					tickLine={false}
					tickMargin={10}
				/>
				<ChartTooltip content={<ChartTooltipContent indicator="line" />} />
				<ChartLegend content={<ChartLegendContent className="-mt-6" />} />
				<Bar dataKey="variation" fill="var(--chart-5)" radius={4}>
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
						className="fill-foreground"
						fontSize={12}
						offset={12}
						position="top"
					/>
				</Bar>
			</BarChart>
		</ChartContainer>
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

	return (
		<ChartContainer
			className="-translate-x-4 mt-4 min-h-[200px] w-[calc(100%+32px)]"
			config={chartConfig}
		>
			<LineChart
				data={chartData}
				margin={{
					top: 24,
					left: 16,
					right: 16,
				}}
			>
				<CartesianGrid key="cartesian-grid" vertical={false} />
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
					width={0}
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
						)
					}}
					key="total-rating-line"
					stroke="var(--chart-1)"
					strokeWidth={2}
					type="natural"
				>
					<LabelList
						className="fill-foreground"
						fontSize={12}
						key="label-list"
						offset={12}
						position="top"
					/>
				</Line>
			</LineChart>
		</ChartContainer>
	)
}
