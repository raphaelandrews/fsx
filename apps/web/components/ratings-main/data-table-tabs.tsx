"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "./data-table";
import { columnsBlitz, columnsClassic, columnsRapid } from "./columns";
import { useState } from "react";
import type { TopPlayers } from "@/schemas/players";

type TabValue = "rapid" | "classic" | "blitz";

interface DataTableTabsProps {
  topPlayers: TopPlayers;
}

export const DataTableTabs = ({ topPlayers }: DataTableTabsProps) => {
  const [currentTab, setCurrentTab] = useState<TabValue>("rapid");

  const tabConfig = {
    classic: { data: topPlayers.topClassic, columns: columnsClassic },
    rapid: { data: topPlayers.topRapid, columns: columnsRapid },
    blitz: { data: topPlayers.topBlitz, columns: columnsBlitz },
  };

  return (
    <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as TabValue)}>
      <TabsList className="mb-4">
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

      {Object.entries(tabConfig).map(([value, { data, columns }]) => (
        <TabsContent key={value} value={value}>
          <DataTable data={data} columns={columns} />
        </TabsContent>
      ))}
    </Tabs>
  );
};