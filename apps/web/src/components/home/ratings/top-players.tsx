
import React from "react"
import { AnalyticsUpIcon } from "@hugeicons/core-free-icons"

import { DataTableWrapper } from "./data-table-wrapper"
import { columnsBlitz, columnsClassic, columnsRapid } from "./columns"

import { Section } from "@/components/home/section"
import { RatingUpdateTooltip } from "@/components/rating-update-tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@fsx/ui/components/tabs"
import { SectionButton } from "@/components/section-button"

type TabValue = "rapid" | "classic" | "blitz"

const tabMap: Record<TabValue, string> = {
  blitz: "topBlitz",
  rapid: "topRapid",
  classic: "topClassic",
} as const

export function TopPlayers({ topPlayers }: any) {
  const [currentTab, setCurrentTab] = React.useState<TabValue>("rapid")
  const currentData = topPlayers[tabMap[currentTab]]

  return (
    <Section icon={AnalyticsUpIcon} label="Rating" main={false}>
      <Tabs
        className="w-full"
        onValueChange={(value) => setCurrentTab(value as TabValue)}
        value={currentTab}
      >
        <TabsList className="h-auto w-full rounded-none bg-transparent p-0">
          <TabsTrigger
            className="w-full rounded-none border-0 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-none"
            value="classic"
          >
            Clássico
          </TabsTrigger>
          <TabsTrigger
            className="w-full rounded-none border-0 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-none"
            value="rapid"
          >
            Rápido
          </TabsTrigger>
          <TabsTrigger
            className="w-full rounded-none border-0 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-none"
            value="blitz"
          >
            Blitz
          </TabsTrigger>
        </TabsList>


        <div className="p-3">
          <RatingUpdateTooltip />
        </div>


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
      <SectionButton href="/ratings" label="Ver Rating" />
    </Section>
  )
}
