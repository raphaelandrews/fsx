"use client"

import React, { useEffect, useState } from "react"
import {
	type ColumnDef,
	type ColumnFiltersState,
	type Row,
	type SortingState,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table"

import type {
	Circuit,
	CircuitPlayer,
	CircuitClub,
	CircuitPhase,
} from "./components/types"

import {
	circuitClubsColumns,
	circuitSchoolSubcomponentColumns,
	circuitTotalColumns,
} from "./components/columns"
import { DataTable } from "./components/data-table"
import { DataTableSchool } from "./components/data-table-school"

import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { categories } from "./data/data"
import CategoryFilter from "./components/category-filter"
import { DottedSeparator } from "@/components/dotted-separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"
import { DataTablePagination } from "./components/data-table-pagination"
import { DataTableFacetedFilter } from "./components/data-table-faceted-filter"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"

export function Client({ circuits }: { circuits: Circuit[] }) {
	const [selectedTab, setSelectedTab] = useState<string | undefined>(undefined)
	const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
		"Master"
	)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		if (circuits.length > 0 && circuits[0].circuitPhase.length > 0) {
			setSelectedTab(circuits[0].name)
			if (circuits[0].type === "categories") {
				setSelectedCategory("Master")
			}
			setLoading(false)
		}
	}, [circuits])

	if (loading) {
		return (
			<div className="mt-6 h-full w-full">
				<Skeleton className="aspect-square h-[40px] w-full rounded-xl" />
				<div className="mt-3 flex flex-col gap-2">
					{[...Array(6)].map((_) => (
						<Skeleton
							className="aspect-square h-[32px] rounded-xl"
							key={crypto.randomUUID()}
						/>
					))}
				</div>
			</div>
		)
	}

	if (circuits.length === 0) {
		return <div>Sem circuitos no momento.</div>
	}

	return (
		<Tabs
			defaultValue={circuits[0].name}
			onValueChange={setSelectedTab}
			value={selectedTab}
			className="gap-0"
		>
			<TabsList className="h-auto w-full rounded-none bg-transparent p-0">
				{circuits.map((circuit, index) => (
					<React.Fragment key={circuit.name}>
						<TabsTrigger
							className="w-full rounded-none border-0 py-2.5 data-[state=active]:bg-background dark:data-[state=active]:bg-input/30 data-[state=active]:shadow-none"
							value={circuit.name}
						>
							{circuit.name}
						</TabsTrigger>
						{index < circuits.length - 1 && (
							<div className="h-auto w-px self-stretch bg-[image:repeating-linear-gradient(to_bottom,var(--border)_0px,var(--border)_6px,transparent_6px,transparent_14px)] bg-[length:1px_100%] bg-no-repeat" />
						)}
					</React.Fragment>
				))}
			</TabsList>
			<DottedSeparator />
			{circuits.map((circuit) => (
				<div key={circuit.name}>
					<TabsContent value={circuit.name}>
						{circuit.type === "categories" && (
							<Tabs
								defaultValue="Master"
								onValueChange={setSelectedCategory}
								value={selectedCategory}
								className="gap-0"
							>
								<TabsList className="h-auto w-full rounded-none bg-transparent p-0">
									{["Master", "Juvenil", "Futuro"].map(
										(category, index, arr) => (
											<React.Fragment key={category}>
												<TabsTrigger
													className="w-full rounded-none border-0 py-2.5 data-[state=active]:bg-background dark:data-[state=active]:bg-input/30 data-[state=active]:shadow-none"
													value={category}
												>
													{category}
												</TabsTrigger>
												{index < arr.length - 1 && (
													<div className="h-auto w-px self-stretch bg-[image:repeating-linear-gradient(to_bottom,var(--border)_0px,var(--border)_6px,transparent_6px,transparent_14px)] bg-[length:1px_100%] bg-no-repeat" />
												)}
											</React.Fragment>
										)
									)}
								</TabsList>
								<DottedSeparator />
								{["Master", "Juvenil", "Futuro"].map((category) => (
									<TabsContent key={category} value={category}>
										<PlayerPointsTable
											category={category}
											circuit={circuit}
											filter={false}
										/>
									</TabsContent>
								))}
							</Tabs>
						)}
						{circuit.type === "school" && (
							<Tabs defaultValue="main" className="gap-0">
								<TabsList className="h-auto w-full rounded-none bg-transparent p-0">
									<TabsTrigger
										className="w-full rounded-none border-0 py-2.5 data-[state=active]:bg-background dark:data-[state=active]:bg-input/30 data-[state=active]:shadow-none"
										value="main"
									>
										Clubes
									</TabsTrigger>
									<div className="h-auto w-px self-stretch bg-[image:repeating-linear-gradient(to_bottom,var(--border)_0px,var(--border)_6px,transparent_6px,transparent_14px)] bg-[length:1px_100%] bg-no-repeat" />
									<TabsTrigger
										className="w-full rounded-none border-0 py-2.5 data-[state=active]:bg-background dark:data-[state=active]:bg-input/30 data-[state=active]:shadow-none"
										value="categories"
									>
										Categorias
									</TabsTrigger>
								</TabsList>
								<DottedSeparator />
								<TabsContent value="main">
									<ClubsPointsTable category={undefined} circuit={circuit} />
								</TabsContent>
								<TabsContent value="categories">
									<PlayerPointsTable
										category={undefined}
										circuit={circuit}
										filter={true}
									/>
								</TabsContent>
							</Tabs>
						)}
						{circuit.type === "default" && (
							<PlayerPointsTable
								category={undefined}
								circuit={circuit}
								filter={false}
							/>
						)}
					</TabsContent>
				</div>
			))}
		</Tabs>
	)
}

const getColumns = (
	phases: CircuitPhase[],
	circuitType: string
): ColumnDef<CircuitPlayer>[] => {
	if (circuitType === "school") {
		return circuitSchoolSubcomponentColumns(phases)
	}
	return circuitTotalColumns(phases)
}

const PlayerPointsTable = ({
	circuit,
	category,
	filter,
}: {
	circuit: Circuit
	category?: string
	filter: boolean
}) => {
	const data = React.useMemo(() => {
		const d = aggregatePlayerPoints(circuit, category)
		d.sort((a, b) => (b.total || 0) - (a.total || 0))
		return d
	}, [circuit, category])

	const columns = React.useMemo(
		() => getColumns(circuit.circuitPhase, circuit.type),
		[circuit]
	)

	const [sorting, setSorting] = useState<SortingState>([])
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 20,
	})

	const table = useReactTable({
		data,
		columns,
		state: {
			sorting,
			columnFilters,
			pagination,
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onPaginationChange: setPagination,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
	})

	return (
		<div className="flex flex-col">
			{filter && (
				<>
					<div className="p-4">
						<div className="flex items-center justify-between">
							<div className="flex flex-1 flex-col items-start space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
								{table.getColumn("category") && (
									<DataTableFacetedFilter
										column={table.getColumn("category")}
										options={categories}
										title="Categoria"
									/>
								)}
								{table.getState().columnFilters.length > 0 && (
									<Button
										className="h-8 px-2 lg:px-3"
										onClick={() => table.resetColumnFilters()}
										variant="ghost"
									>
										Limpar
										<XIcon className="ml-2 h-4 w-4" />
									</Button>
								)}
							</div>
						</div>
					</div>
					<DottedSeparator />
				</>
			)}

			<div className="relative p-4">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow className="border-b-0" key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead colSpan={header.colSpan} key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									className="border-b-0"
									data-state={row.getIsSelected() && "selected"}
									key={row.id}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									className="h-24 text-center"
									colSpan={columns.length}
								>
									Sem resultados.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DottedSeparator />
			<div className="p-4">
				<DataTablePagination table={table} />
			</div>
		</div>
	)
}

type CategoryTypes = string | string[] | undefined

const aggregatePlayerPoints = (
	circuit: Circuit,
	category?: CategoryTypes
): CircuitPlayer[] => {
	const playerPointsMap = new Map<string, CircuitPlayer>()

	for (const phase of circuit.circuitPhase) {
		for (const podium of phase.circuitPodiums) {
			const categoryMatch =
				!category ||
				(Array.isArray(category)
					? category.includes(podium.category)
					: podium.category === category)

			if (categoryMatch) {
				const playerName = podium.player.name
				const points = podium.points || 0

				if (!playerPointsMap.has(playerName)) {
					playerPointsMap.set(playerName, {
						id: podium.player.id,
						name: podium.player.name,
						nickname: podium.player.nickname,
						imageUrl: podium.player.imageUrl,
						playersToTitles: podium.player.playersToTitles,
						total: 0,
						category: podium.category,
						type: circuit.type,
						pointsByPhase: {},
					})
				}

				const playerPoints = playerPointsMap.get(playerName)
				if (playerPoints) {
					playerPoints.pointsByPhase[phase.tournament.name] = points
					playerPoints[phase.tournament.name] = points
					playerPoints.total = (playerPoints.total || 0) + points
				}
			}
		}
	}

	return Array.from(playerPointsMap.values())
}

const aggregateClubPoints = (
	circuit: Circuit,
	category?: CategoryTypes
): CircuitClub[] => {
	const clubPointsMap = new Map<string, CircuitClub>()
	const playerPointsMap = new Map<string, CircuitPlayer>()

	for (const phase of circuit.circuitPhase) {
		for (const podium of phase.circuitPodiums) {
			const categoryMatch =
				!category ||
				(Array.isArray(category)
					? category.includes(podium.category)
					: podium.category === category)

			if (categoryMatch) {
				const clubName = podium.player.club?.name || "Unknown Club"
				const points = podium.points || 0

				if (!clubPointsMap.has(clubName)) {
					clubPointsMap.set(clubName, {
						clubId: podium.player.club?.id || 0,
						clubName,
						clubLogo: podium.player.club?.logo || "",
						total: 0,
						pointsByPhase: {},
						players: [],
					})
				}

				const clubPoints = clubPointsMap.get(clubName)
				if (clubPoints) {
					clubPoints.pointsByPhase[phase.tournament.name] =
						(clubPoints.pointsByPhase[phase.tournament.name] || 0) + points
					clubPoints.total += points

					if (!playerPointsMap.has(podium.player.id as unknown as string)) {
						playerPointsMap.set(podium.player.id as unknown as string, {
							id: podium.player.id,
							name: podium.player.name,
							nickname: podium.player.nickname,
							imageUrl: podium.player.imageUrl,
							playersToTitles: podium.player.playersToTitles,
							total: 0,
							clubName,
							category: podium.category,
						})
					}

					const playerPoints = playerPointsMap.get(
						podium.player.id as unknown as string
					)
					if (playerPoints) {
						playerPoints.total = (playerPoints.total || 0) + points
					}
				}
			}
		}
	}

	for (const club of clubPointsMap.values()) {
		for (const player of playerPointsMap.values()) {
			if (player.clubName === club.clubName) {
				club.players.push(player)
			}
		}
		club.players.sort(
			(a: CircuitPlayer, b: CircuitPlayer) => (b.total || 0) - (a.total || 0)
		)
	}

	return Array.from(clubPointsMap.values())
}

const aggregatePoints = (
	circuit: Circuit,
	category?: CategoryTypes
): CircuitPlayer[] | CircuitClub[] => {
	if (circuit.type === "school") {
		return aggregateClubPoints(circuit, category)
	}
	return aggregatePlayerPoints(circuit, category)
}

const ClubsPointsTable = ({
	circuit,
	category,
}: {
	circuit: Circuit
	category?: string
}) => {
	const [selectedCategories, setSelectedCategories] = useState<string[]>([])

	const combinedCategories = React.useMemo(
		() =>
			category
				? [...new Set([...selectedCategories, category])]
				: selectedCategories,
		[category, selectedCategories]
	)

	const data = React.useMemo(
		() =>
			aggregatePoints(
				circuit,
				combinedCategories.length > 0 ? combinedCategories : undefined
			),
		[circuit, combinedCategories]
	)

	if (!(Array.isArray(data) && data.every(isClubPoints))) {
		return <div>Ops, algo deu errado.</div>
	}

	const columns = React.useMemo(
		() => circuitClubsColumns(circuit.circuitPhase),
		[circuit]
	)

	const filteredData = React.useMemo(() => {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const fd = (data as any[]).filter(
			(club) =>
				combinedCategories.length === 0 ||
				club.players.some((player: { category: string }) =>
					combinedCategories.includes(player.category || "")
				)
		)
		fd.sort((a: any, b: any) => b.total - a.total)
		return fd
	}, [data, combinedCategories])

	const [sorting, setSorting] = useState<SortingState>([])
	const [expanded, setExpanded] = useState({})
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 20,
	})

	const table = useReactTable({
		data: filteredData,
		columns,
		state: {
			sorting,
			expanded,
			pagination,
		},
		onSortingChange: setSorting,
		onExpandedChange: setExpanded,
		onPaginationChange: setPagination,
		getRowCanExpand: () => true,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
	})

	const renderSubComponent = ({ row }: { row: Row<CircuitClub> }) => {
		const filteredPlayers = row.original.players.filter(
			(player: { category: string }) =>
				selectedCategories.length === 0 ||
				selectedCategories.includes(player.category || "")
		)

		const filteredCircuit: Circuit = {
			name: circuit.name,
			type: circuit.type,
			circuitPhase: circuit.circuitPhase.map((phase) => ({
				...phase,
				circuitPodiums: phase.circuitPodiums.filter((podium) =>
					filteredPlayers.some(
						(player: CircuitPlayer) => player.id === podium.player.id
					)
				),
			})),
		}

		return (
			<div className="[&>div>div>div>table>tbody>tr>td:first-child]:!text-center [&>div>div>div>table>tbody>tr>td]:!text-left [&>div>div>div>table>tbody>tr>td:first-child]:!rounded-none [&>div>div>div>table>thead>tr>td:first-child]:!rounded-none [&>div>div>div>table>tbody>tr>td:last-child]:!rounded-none [&>div>div>div>table>thead>tr>td:last-child]:!rounded-none [&>div>div>table>tbody>tr]:!bg-transparent [&>div>div>table>thead>tr]:!bg-transparent -ml-3 -mt-6 mb-3 w-[calc(100%+20px)]">
				<PlayerPointsTable
					category={undefined}
					circuit={filteredCircuit}
					filter={false}
				/>
			</div>
		)
	}

	return (
		<div className="flex flex-col">
			<div className="p-4">
				<CategoryFilter
					categories={categories}
					onCategoryChange={setSelectedCategories}
					selectedCategories={selectedCategories}
				/>
			</div>
			<DottedSeparator />
			<div className="relative p-4">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow className="border-b-0" key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead colSpan={header.colSpan} key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<React.Fragment key={row.id}>
									<TableRow
										className="border-b-0"
										data-state={row.getIsSelected() && "selected"}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</TableCell>
										))}
									</TableRow>
									{row.getIsExpanded() && (
										<TableRow>
											<TableCell colSpan={row.getVisibleCells().length}>
												{renderSubComponent({ row })}
											</TableCell>
										</TableRow>
									)}
								</React.Fragment>
							))
						) : (
							<TableRow>
								<TableCell
									className="h-24 text-center"
									colSpan={columns.length}
								>
									Sem resultados.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DottedSeparator />
			<div className="p-4">
				<DataTablePagination table={table} />
			</div>
		</div>
	)
}

function isClubPoints(item: CircuitClub | CircuitPlayer): item is CircuitClub {
	return (
		item &&
		typeof item.clubId === "number" &&
		typeof item.clubName === "string" &&
		typeof item.clubLogo === "string" &&
		typeof item.total === "number" &&
		typeof item.pointsByPhase === "object" &&
		Array.isArray(item.players)
	)
}
