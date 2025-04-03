"use client"

import { useEffect, useState } from "react";
import { getPlayersTop } from "@/actions/get-players";

import { DataTable } from "./data-table";
import { columnsBlitz, columnsClassic, columnsRapid } from "./columns";
import type { Player } from "@/types";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DataTableTabs = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      const res = await getPlayersTop();
      setPlayers(res);
      setLoading(false);
    };

    getData();
  }, []);

  const sortData = (res: Player[], rating: keyof Player) => {
    const sortedData = [...res].sort(
      (a, b) => (b[rating] as number) - (a[rating] as number)
    );
    setPlayers(sortedData);
    setLoading(false);
  };
  
  return (
    <Tabs defaultValue="rapid">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 mb-4">
        <TabsList>
          <TabsTrigger
            value="classic"
            className="w-20 sm:w-24"
            onClick={() => sortData(players, "classic")}
          >
            Clássico
          </TabsTrigger>
          <TabsTrigger
            value="rapid"
            className="w-20 sm:w-24"
            onClick={() => sortData(players, "rapid")}
          >
            Rápido
          </TabsTrigger>
          <TabsTrigger
            value="blitz"
            className="w-20 sm:w-24"
            onClick={() => sortData(players, "blitz")}
          >
            Blitz
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="classic">
        {loading ? (
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
        ) : (
          <DataTable
            data={players}
            columns={columnsClassic}
          />
        )}
      </TabsContent>
      <TabsContent value="rapid">
        {loading ? (
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
        ) : (
          <DataTable
            data={players}
            columns={columnsRapid}
          />
        )}
      </TabsContent>
      <TabsContent value="blitz">
        {loading ? (
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
        ) : (
          <DataTable
            data={players}
            columns={columnsBlitz}
          />
        )}
      </TabsContent>
    </Tabs>
  );
};

export default DataTableTabs;
