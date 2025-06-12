"use client";

import React from "react";
import { BarChart2Icon } from "lucide-react";

import type { APITopPlayersResponse } from "@/db/queries";

import { DataTable } from "./data-table";
import { columnsBlitz, columnsClassic, columnsRapid } from "./columns";

import { HomeSection } from "@/components/home/home-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type SuccessResponse = Extract<APITopPlayersResponse, { success: true }>;

interface DataTableTabsProps {
  topPlayers: SuccessResponse["data"];
}

type TabValue = "rapid" | "classic" | "blitz";
type TabKey = keyof SuccessResponse["data"];

const tabMap: Record<TabValue, TabKey> = {
  blitz: "topBlitz",
  rapid: "topRapid",
  classic: "topClassic",
} as const;

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function DataTableTabs({ topPlayers }: any) {
  const [currentTab, setCurrentTab] = React.useState<TabValue>("rapid");
  const currentData = topPlayers[tabMap[currentTab]];

  return (
    <HomeSection
      label="Rating"
      href={"/ratings"}
      icon={BarChart2Icon}
      main={false}
    >
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
    </HomeSection>
  );
}
