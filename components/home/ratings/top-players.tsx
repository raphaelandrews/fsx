"use client"

import React from "react"
import { BarChart2Icon } from "lucide-react"

import type { APITopPlayersResponse } from "@/db/queries"

import { DataTableWrapper } from "./data-table-wrapper"
import { columnsBlitz, columnsClassic, columnsRapid } from "./columns"

import { Section } from "@/components/home/section"
import { RatingUpdateTooltip } from "@/components/rating-update-tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DottedButton } from "@/components/dotted-button"

type SuccessResponse = Extract<APITopPlayersResponse, { success: true }>

type TabValue = "rapid" | "classic" | "blitz"
type TabKey = keyof SuccessResponse["data"]

const tabMap: Record<TabValue, TabKey> = {
	blitz: "topBlitz",
	rapid: "topRapid",
	classic: "topClassic",
} as const

// biome-ignore lint/suspicious/noExplicitAny: No
export function TopPlayers({ topPlayers }: any) {
	const [currentTab, setCurrentTab] = React.useState<TabValue>("rapid")
	const currentData = topPlayers[tabMap[currentTab]]

	return (
		<Section icon={BarChart2Icon} label="Rating" main={false}>
			<Tabs
				className="w-full p-3"
				onValueChange={(value) => setCurrentTab(value as TabValue)}
				value={currentTab}
			>
				<div className="flex flex-col items-start gap-3 mb-4 sm:flex-row sm:items-center">
					<TabsList className="w-full sm:w-auto">
						<TabsTrigger
							className="w-full transition-colors hover:bg-accent/50 sm:w-24"
							value="classic"
						>
							Clássico
						</TabsTrigger>
						<TabsTrigger
							className="w-full transition-colors hover:bg-accent/50 sm:w-24"
							value="rapid"
						>
							Rápido
						</TabsTrigger>
						<TabsTrigger
							className="w-full transition-colors hover:bg-accent/50 sm:w-24"
							value="blitz"
						>
							Blitz
						</TabsTrigger>
					</TabsList>
					<RatingUpdateTooltip />
				</div>

				<TabsContent className="mt-0" value="classic">
					<DataTableWrapper columns={columnsClassic} data={currentData} />
				</TabsContent>

				<TabsContent className="mt-0" value="rapid">
					<DataTableWrapper columns={columnsRapid} data={currentData} />
				</TabsContent>

				<TabsContent className="mt-0" value="blitz">
					<DataTableWrapper columns={columnsBlitz} data={currentData} />
				</TabsContent>
			</Tabs>
			<DottedButton href="/ratings" label="Ver Rating" />
		</Section>
	)
}
