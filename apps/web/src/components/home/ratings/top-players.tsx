import type { inferRouterOutputs } from "@trpc/server"
import { AnalyticsUpIcon } from "@hugeicons/core-free-icons"

import type { AppRouter } from "@fsx/api/routers/index"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@fsx/ui/components/tabs"

import { DataTable } from "@/components/data-table/data-table"
import { Section } from "@/components/home/section"
import { SectionButton } from "@/components/section-button"

import { columnsBlitz, columnsClassic, columnsRapid } from "./columns"
import { RATING_LABELS_PT } from "@fsx/api/rating-types";

type TopPlayersData = inferRouterOutputs<AppRouter>["topPlayers"]["list"]

const TABS = [
  { value: "classic", label: RATING_LABELS_PT.classic, key: "topClassic", columns: columnsClassic },
  { value: "rapid", label: RATING_LABELS_PT.rapid, key: "topRapid", columns: columnsRapid },
  { value: "blitz", label: RATING_LABELS_PT.blitz, key: "topBlitz", columns: columnsBlitz },
] as const

export function TopPlayers({ topPlayers }: { topPlayers: TopPlayersData }) {
  return (
    <Section icon={AnalyticsUpIcon} label="Rating" main={false}>
      <Tabs className="w-full" defaultValue="rapid">
        <div className="flex justify-center">
          <TabsList>
            {TABS.map(({ value, label }) => (
              <TabsTrigger key={value} value={value}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="p-3">
          {TABS.map(({ value, key, columns }) => (
            <TabsContent key={value} className="mt-0" value={value}>
              <DataTable columns={columns} data={topPlayers[key]} />
            </TabsContent>
          ))}
        </div>
      </Tabs>
      <SectionButton href="/ratings" label="Ver Rating" />
    </Section>
  )
}
