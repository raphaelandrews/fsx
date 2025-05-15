"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { InfoIcon } from "lucide-react";

import { DataTable } from "@/components/players-table/data-table";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  columnsBlitz,
  columnsClassic,
  columnsRapid,
} from "@/components/players-table/columns";
import type { Players } from "@/db/queries";

interface RatingsTablesProps {
  players: Players[];
  pagination: {
    totalPages: number;
  };
}

export function RatingsTables({ players, pagination }: RatingsTablesProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const defaultTab = searchParams.get("sortBy") || "rapid";

  React.useEffect(() => {
    router.refresh();
  }, [router]);

  const onTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", value);
    router.push(`${pathname}?${params.toString()}`);
  };
console.log(players)
  return (
    <Tabs defaultValue={defaultTab} onValueChange={onTabChange}>
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
        <div className="mt-4">
          <DataTable
            data={players}
            columns={columnsClassic}
            totalPages={pagination.totalPages}
          />
        </div>
      </TabsContent>

      <TabsContent value="rapid">
        <div className="mt-4">
          <DataTable
            data={players}
            columns={columnsRapid}
            totalPages={pagination.totalPages}
          />
        </div>
      </TabsContent>

      <TabsContent value="blitz">
        <div className="mt-4">
          <DataTable
            data={players}
            columns={columnsBlitz}
            totalPages={pagination.totalPages}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

function Info() {
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
            <InfoIcon className="w-4 h-4 min-w-[1rem] rounded text-primary" />
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
}
