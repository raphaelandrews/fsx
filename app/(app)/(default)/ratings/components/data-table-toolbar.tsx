"use client"

import React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { XIcon } from "lucide-react"

import { birthdays, sexes, titles } from "./data/data"
import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type FilterOption = {
	value: string
	label: string
}

interface DataTableToolbarProps {
	clubs: FilterOption[]
	locations: FilterOption[]
}

export function DataTableToolbar({ clubs, locations }: DataTableToolbarProps) {
	const router = useRouter()
	const searchParams = useSearchParams()
	const pathname = usePathname()
	const [inputValue, setInputValue] = React.useState(
		searchParams.get("name") || ""
	)
	const [debouncedValue, setDebouncedValue] = React.useState(inputValue)

	React.useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(inputValue)
		}, 300)

		return () => {
			clearTimeout(handler)
		}
	}, [inputValue])

	// biome-ignore lint/correctness/useExhaustiveDependencies: Not
	React.useEffect(() => {
		updateSearchParams({ name: debouncedValue || undefined })
	}, [debouncedValue])

	const updateSearchParams = (
		params: Record<string, string | string[] | undefined>
	) => {
		const newSearchParams = new URLSearchParams(searchParams.toString())

		for (const [key, value] of Object.entries(params)) {
			if (Array.isArray(value)) {
				newSearchParams.delete(key)
				for (const v of value) {
					newSearchParams.append(key, v)
				}
			} else if (value === undefined) {
				newSearchParams.delete(key)
			} else {
				newSearchParams.set(key, value)
			}
		}

		if (!newSearchParams.has("limit")) {
			newSearchParams.set("limit", "20")
		}
		if (!newSearchParams.has("sortBy")) {
			newSearchParams.set("sortBy", "rapid")
		}
		router.push(`${pathname}?${newSearchParams.toString()}`)
	}

	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 flex-col items-start space-y-2">
				<Input
					className="h-8 w-[150px] lg:w-[250px]"
					onChange={(event) => {
						setInputValue(event.target.value)
					}}
					placeholder="Procurar jogadores..."
					value={inputValue}
				/>
				<div className="flex flex-1 flex-col items-start space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
					<DataTableFacetedFilter
						onChange={(value) => {
							updateSearchParams({
								location: value.length > 0 ? value : undefined,
							})
						}}
						options={locations}
						title="Local"
						value={searchParams.getAll("location")}
					/>
					<DataTableFacetedFilter
						onChange={(value) => {
							updateSearchParams({
								club: value.length > 0 ? value : undefined,
							})
						}}
						options={clubs}
						title="Clubes"
						value={searchParams.getAll("club")}
					/>
					<DataTableFacetedFilter
						onChange={(value) => {
							updateSearchParams({
								title: value.length > 0 ? value : undefined,
							})
						}}
						options={titles}
						title="Títulos"
						value={searchParams.getAll("title")}
					/>
					<DataTableFacetedFilter
						onChange={(value) => {
							updateSearchParams({ sex: value[0] || undefined })
						}}
						options={sexes}
						title="Categoria"
						value={
							searchParams.get("sex") === null
								? []
								: [searchParams.get("sex") || ""]
						}
					/>
					<DataTableFacetedFilter
						onChange={(value) => {
							updateSearchParams({
								group: value.length > 0 ? value : undefined,
							})
						}}
						options={birthdays}
						title="Grupo"
						value={searchParams.getAll("group")}
					/>
					{Boolean(
						searchParams.getAll("location").length ||
							searchParams.getAll("club").length ||
							searchParams.getAll("title").length ||
							searchParams.get("sex") ||
							searchParams.getAll("group").length ||
							inputValue
					) && (
						<Button
							className="h-8 px-2 lg:px-3"
							onClick={() => {
								setInputValue("")
								router.push(
									`/ratings?page=1&limit=${searchParams.get(
										"limit"
									)}&sortBy=${searchParams.get("sortBy")}`
								)
							}}
							variant="ghost"
						>
							Limpar
							<XIcon className="ml-2 h-4 w-4" />
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}
