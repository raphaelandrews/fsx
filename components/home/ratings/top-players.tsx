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
import { DottedSeparator } from "@/components/dotted-separator"

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
				className="w-full"
				onValueChange={(value) => setCurrentTab(value as TabValue)}
				value={currentTab}
			>
				<TabsList className="h-auto w-full rounded-none bg-transparent p-0">
					<TabsTrigger
						className="w-full rounded-none border-0 py-2.5 data-[state=active]:bg-background dark:data-[state=active]:bg-input/30 data-[state=active]:shadow-none"
						value="classic"
					>
						Clássico
					</TabsTrigger>
					<div className="h-auto w-px self-stretch bg-[image:repeating-linear-gradient(to_bottom,var(--border)_0px,var(--border)_6px,transparent_6px,transparent_14px)] bg-[length:1px_100%] bg-no-repeat" />
					<TabsTrigger
						className="w-full rounded-none border-0 py-2.5 data-[state=active]:bg-background dark:data-[state=active]:bg-input/30 data-[state=active]:shadow-none"
						value="rapid"
					>
						Rápido
					</TabsTrigger>
					<div className="h-auto w-px self-stretch bg-[image:repeating-linear-gradient(to_bottom,var(--border)_0px,var(--border)_6px,transparent_6px,transparent_14px)] bg-[length:1px_100%] bg-no-repeat" />
					<TabsTrigger
						className="w-full rounded-none border-0 py-2.5 data-[state=active]:bg-background dark:data-[state=active]:bg-input/30 data-[state=active]:shadow-none"
						value="blitz"
					>
						Blitz
					</TabsTrigger>
				</TabsList>

				<DottedSeparator />

				<div className="p-3">
					<RatingUpdateTooltip />
				</div>

				<DottedSeparator />

				<div className="p-3">
					<TabsContent className="mt-0" value="classic">
						<DataTableWrapper columns={columnsClassic} data={currentData} />
					</TabsContent>

					<TabsContent className="mt-0" value="rapid">
						<DataTableWrapper columns={columnsRapid} data={currentData} />
					</TabsContent>

					<TabsContent className="mt-0" value="blitz">
						<DataTableWrapper columns={columnsBlitz} data={currentData} />
					</TabsContent>
				</div>
			</Tabs>
			<DottedButton href="/ratings" label="Ver Rating" />
		</Section>
	)
}
