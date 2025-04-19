import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";

import { topPlayersQueryOptions } from "~/queries/top-players";
import type { TopPlayerData } from "~/schemas";

import { DataTable } from "./data-table";
import { columnsBlitz, columnsClassic, columnsRapid } from "./columns";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

type TabValue = "rapid" | "classic" | "blitz";
type TabKey = keyof TopPlayerData;

const tabMap: Record<TabValue, TabKey> = {
  blitz: "topBlitz",
  rapid: "topRapid",
  classic: "topClassic",
} as const;

const DataTableTabs = () => {
  const { data: topPlayers } = useSuspenseQuery(topPlayersQueryOptions);
  const [currentTab, setCurrentTab] = useState<TabValue>("rapid");

  const currentData = topPlayers[tabMap[currentTab]];

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
        <DataTable data={currentData} columns={columnsClassic} />
      </TabsContent>

      <TabsContent value="rapid" className="mt-0">
        <DataTable data={currentData} columns={columnsRapid} />
      </TabsContent>

      <TabsContent value="blitz" className="mt-0">
        <DataTable data={currentData} columns={columnsBlitz} />
      </TabsContent>
    </Tabs>
  );
};

export default DataTableTabs;
