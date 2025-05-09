import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BarChart2Icon } from "lucide-react";

import {
  topPlayersQueryOptions,
  type SuccessTopPlayersResponse,
} from "~/db/queries";

import { DataTable } from "./data-table";
import { columnsBlitz, columnsClassic, columnsRapid } from "./columns";

import { HomeSection } from "~/components/home/home-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Skeleton } from "~/components/ui/skeleton";

type TabValue = "rapid" | "classic" | "blitz";
type TabKey = keyof SuccessTopPlayersResponse;

const tabMap: Record<TabValue, TabKey> = {
  blitz: "topBlitz",
  rapid: "topRapid",
  classic: "topClassic",
} as const;

export function DataTableTabs() {
  const { data: topPlayers } = useSuspenseQuery(topPlayersQueryOptions());
  const [currentTab, setCurrentTab] = useState<TabValue>("rapid");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentData = topPlayers[tabMap[currentTab]];

  if (!mounted) {
    return (
      <>
        <Skeleton className="w-[296px] h-[36px] aspect-square rounded-xl" />
        <div className="w-full h-full mt-6">
          <Skeleton className="w-full h-[40px] aspect-square rounded-xl" />
          <div className="flex flex-col gap-2 mt-3">
            {[...Array(6)].map((_) => (
              <Skeleton
                key={crypto.randomUUID()}
                className="h-[32px] aspect-square rounded-xl"
              />
            ))}
          </div>
        </div>
      </>
    );
  }

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
};
