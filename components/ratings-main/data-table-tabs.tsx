"use client";

import { useState } from "react";

import type {
  SuccessTopPlayersResponse,
} from "@/db/queries";

import { DataTable } from "./data-table";
import { columnsBlitz, columnsClassic, columnsRapid } from "./columns";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabValue = "rapid" | "classic" | "blitz";
type TabKey = keyof SuccessTopPlayersResponse;

const tabMap: Record<TabValue, TabKey> = {
  blitz: "topBlitz",
  rapid: "topRapid",
  classic: "topClassic",
} as const;

interface DataTableTabsProps {
  topPlayers: SuccessTopPlayersResponse;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const DataTableTabs = ({ topPlayers }: any) => {
  const [currentTab, setCurrentTab] = useState<TabValue>("rapid");

  const currentData = topPlayers ? topPlayers[tabMap[currentTab]] : [];

  return (
    <Tabs
      value={currentTab}
      onValueChange={(value) => setCurrentTab(value as TabValue)}
      className="w-full"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger
            value="classic"
            className="w-full sm:w-24 transition-colors hover:bg-accent/50"
          >
            Clássico
          </TabsTrigger>
          <TabsTrigger
            value="rapid"
            className="w-full sm:w-24 transition-colors hover:bg-accent/50"
          >
            Rápido
          </TabsTrigger>
          <TabsTrigger
            value="blitz"
            className="w-full sm:w-24 transition-colors hover:bg-accent/50"
          >
            Blitz
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="classic" className="mt-0">
        <DataTable data={topPlayers?.topClassic || []} columns={columnsClassic} />
      </TabsContent>

      <TabsContent value="rapid" className="mt-0">
        <DataTable data={topPlayers?.topRapid || []} columns={columnsRapid} />
      </TabsContent>

      <TabsContent value="blitz" className="mt-0">
        <DataTable data={topPlayers?.topBlitz || []} columns={columnsBlitz} />
      </TabsContent>
    </Tabs>
  );
};

export default DataTableTabs;
