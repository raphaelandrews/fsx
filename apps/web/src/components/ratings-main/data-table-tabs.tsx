import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "./data-table";
import { columnsBlitz, columnsClassic, columnsRapid } from "./columns";
import { useSuspenseQuery } from "@tanstack/react-query";
import { topPlayersQueryOptions } from "@/actions/players/playersQueryOptions";
import { useState } from "react";
import type { TopPlayerDataType } from "@/types";

type TabValue = "rapid" | "classic" | "blitz";
type TabKey = keyof TopPlayerDataType;

const tabMap: Record<TabValue, TabKey> = {
  blitz: "topBlitz",
  rapid: "topRapid",
  classic: "topClassic",
} as const;

const DataTableTabs = () => {
  const topPlayersQuery = useSuspenseQuery(topPlayersQueryOptions);
  const toPlayers = topPlayersQuery.data as unknown as TopPlayerDataType;
  const [currentTab, setCurrentTab] = useState<TabValue>("rapid");

  const currentData = toPlayers[tabMap[currentTab]];
console.log(currentData)
  return (
    <Tabs
      value={currentTab}
      onValueChange={(v) => setCurrentTab(v as TabValue)}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 mb-4">
        <TabsList>
          <TabsTrigger value="classic" className="w-20 sm:w-24">
            Clássico
          </TabsTrigger>
          <TabsTrigger value="rapid" className="w-20 sm:w-24">
            Rápido
          </TabsTrigger>
          <TabsTrigger value="blitz" className="w-20 sm:w-24">
            Blitz
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="classic">
        <DataTable data={currentData} columns={columnsClassic} />
      </TabsContent>

      <TabsContent value="rapid">
        <DataTable data={currentData} columns={columnsRapid} />
      </TabsContent>

      <TabsContent value="blitz">
        <DataTable data={currentData} columns={columnsBlitz} />
      </TabsContent>
    </Tabs>
  );
};

export default DataTableTabs;
