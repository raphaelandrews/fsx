"use client";

import React from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { InfoIcon } from "lucide-react";

import type { Players } from "@/db/queries";
import {
  columnsBlitz,
  columnsClassic,
  columnsRapid,
} from "@/app/(routes)/(default)/ratings/components/columns";
import { DataTable } from "@/app/(routes)/(default)/ratings/components/data-table";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RatingsTablesProps {
  initialPlayers?: Players[];
  initialPagination?: {
    totalPages: number;
  };
}

export function Client({
  initialPlayers = [],
  initialPagination = { totalPages: 0 },
}: RatingsTablesProps) {
  const [players, setPlayers] = React.useState(initialPlayers);
  const [pagination, setPagination] = React.useState(initialPagination);
  const [isLoading, setIsLoading] = React.useState(true);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const defaultTab = searchParams.get("sortBy") || "rapid";
  const currentLimit = Number(searchParams.get("limit")) || 20;

  React.useEffect(() => {
    const fetchPlayers = async () => {
      setIsLoading(true);
      const params = new URLSearchParams(searchParams.toString());

      params.set("page", searchParams.get("page") || "1");
      params.set("limit", currentLimit.toString());
      params.set("sortBy", searchParams.get("sortBy") || "rapid");
      params.set("sex", searchParams.get("sex") || "");

      const titles = searchParams.getAll("title");
      for (const title of titles) params.append("title", title);

      const clubs = searchParams.getAll("club");
      for (const club of clubs) params.append("club", club);

      const groups = searchParams.getAll("group");
      for (const group of groups) params.append("group", group);

      const locations = searchParams.getAll("location");
      for (const location of locations) params.append("location", location);

      const response = await fetch(`/api/players?${params.toString()}`);
      const data = await response.json();
      setPlayers(data.data.players || []);
      setPagination(data.data.pagination || { totalPages: 0 });
      setIsLoading(false);
    };

    fetchPlayers();
  }, [searchParams, currentLimit]);

  const onTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", value);
    window.location.href = `${pathname}?${params.toString()}`;
  };

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
        <DataTable
          data={players}
          columns={columnsClassic}
          totalPages={pagination.totalPages}
          isLoading={isLoading}
          pageSize={currentLimit}
        />
      </TabsContent>

      <TabsContent value="rapid">
        <DataTable
          data={players}
          columns={columnsRapid}
          totalPages={pagination.totalPages}
          isLoading={isLoading}
          pageSize={currentLimit}
        />
      </TabsContent>

      <TabsContent value="blitz">
        <DataTable
          data={players}
          columns={columnsBlitz}
          totalPages={pagination.totalPages}
          isLoading={isLoading}
          pageSize={currentLimit}
        />
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
