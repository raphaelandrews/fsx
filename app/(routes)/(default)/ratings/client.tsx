"use client";

import { useEffect, useState } from "react";
import { BarChart2Icon, InfoIcon } from "lucide-react";

import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Players } from "@/db/queries";

export function Client({ players }: { players: Players[] }) {
  const [playersClassic, setClassicPlayers] = useState<Players[]>([]);
  const [playersRapid, setRapidPlayers] = useState<Players[]>([]);
  const [playersBlitz, setBlitzPlayers] = useState<Players[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getData = async () => {
      sortData(players, "classic");
      sortData(players, "rapid");
      sortData(players, "blitz");
      setLoading(false);
    };

    getData();
  }, [players]);

  const sortData = (res: Players[], rating: keyof Players) => {
    const sortedData = [...res].sort(
      (a, b) => (b[rating] as number) - (a[rating] as number)
    );
    if (rating === "classic") {
      setClassicPlayers(sortedData);
    }
    if (rating === "rapid") {
      setRapidPlayers(sortedData);
    }
    if (rating === "blitz") {
      setBlitzPlayers(sortedData);
    }
    setLoading(false);
  };

  return (
    <Tabs defaultValue="rapid">
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
        <Info />
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
          <DataTable data={playersClassic} columns={columns} />
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
          <DataTable data={playersRapid} columns={columns} />
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
          <DataTable data={playersBlitz} columns={columns} />
        )}
      </TabsContent>
    </Tabs>
  );
};

const Info = () => {
  return (
    <div className="flex items-center gap-5">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-8 h-8 rounded-full p-0">
            <InfoIcon className="h-4 w-4 text-primary" />
            <span className="sr-only">Open popover</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex justify-start items-start gap-2 text-sm">
            <BarChart2Icon className="w-4 h-4 min-w-[1rem] rounded text-primary" />
            <div className="flex flex-col gap-2">
              <p>
                Na tabela de rating constam apenas os jogadores ativos na FSX.
              </p>
              <p>
                É considerado jogador ativo o enxadrista que participou de ao
                menos um torneio nos últimos dois anos.
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
