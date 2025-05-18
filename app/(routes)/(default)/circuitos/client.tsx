"use client";

import { useEffect, useState } from "react";
import type { ColumnDef, Row } from "@tanstack/react-table";

import type {
  Circuit,
  CircuitPlayer,
  CircuitPodium,
  CircuitClub,
  CircuitPhase,
} from "./components/types";

import {
  circuitClubsColumns,
  circuitSchoolSubcomponentColumns,
  circuitTotalColumns,
} from "./components/columns";
import { DataTable } from "./components/data-table";
import { DataTableSchool } from "./components/data-table-school";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categories } from "./data/data";
import CategoryFilter from "./components/category-filter";
import React from "react";

interface ClientProps {
  circuits: Circuit[];
}

export function Client({ circuits }: ClientProps) {
  const [circuitPodiums, setCircuitPodiums] = useState<CircuitPodium[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string | undefined>(
    undefined
  );
  const [selectedTab, setSelectedTab] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    "Master"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (circuits.length > 0 && circuits[0].circuitPhase.length > 0) {
      setSelectedPhase(circuits[0].circuitPhase[0].tournament.name);
      setSelectedTab(circuits[0].name);
      if (circuits[0].type === "categories") {
        setSelectedCategory("Master");
      }
      setCircuitPodiums(circuits[0].circuitPhase[0].circuitPodiums);
      setLoading(false);
    }
  }, [circuits]);

  useEffect(() => {
    if (selectedPhase && selectedTab) {
      const selectedCircuit = circuits.find(
        (circuit) => circuit.name === selectedTab
      );
      if (selectedCircuit) {
        const phase = selectedCircuit.circuitPhase.find(
          (phase) => phase.tournament.name === selectedPhase
        );
        if (phase) {
          setCircuitPodiums(phase.circuitPodiums);
        }
      }
    }
  }, [selectedPhase, selectedTab, circuits]);

  useEffect(() => {
    if (selectedTab && circuits.length > 0) {
      const selectedCircuit = circuits.find(
        (circuit) => circuit.name === selectedTab
      );
      if (selectedCircuit && selectedCircuit.circuitPhase.length > 0) {
        setSelectedPhase(selectedCircuit.circuitPhase[0].tournament.name);
      }
    }
  }, [selectedTab, circuits]);

  if (loading) {
    return (
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
    );
  }

  if (circuits.length === 0) {
    return <div>Sem circuitos no momento.</div>;
  }

  return (
    <Tabs
      value={selectedTab}
      onValueChange={setSelectedTab}
      defaultValue={circuits[0].name}
    >
      <TabsList className="grid grid-cols-3 w-[400px] max-w-full">
        {circuits.map((circuit) => (
          <TabsTrigger key={circuit.name} value={circuit.name}>
            {circuit.name}
          </TabsTrigger>
        ))}
      </TabsList>
      {circuits.map((circuit) => (
        <div key={circuit.name}>
          <TabsContent value={circuit.name}>
            {circuit.type === "categories" && (
              <Tabs
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                defaultValue="Master"
              >
                <TabsList className="mt-2">
                  {["Master", "Juvenil", "Futuro"].map((category) => (
                    <TabsTrigger key={category} value={category}>
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {["Master", "Juvenil", "Futuro"].map((category) => (
                  <TabsContent key={category} value={category}>
                    <PlayerPointsTable
                      circuit={circuit}
                      category={category}
                      filter={false}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            )}
            {circuit.type === "school" && (
              <Tabs defaultValue="main">
                <TabsList className="mt-2">
                  <TabsTrigger value="main">Clubes</TabsTrigger>
                  <TabsTrigger value="categories">Categorias</TabsTrigger>
                </TabsList>
                <TabsContent value="main">
                  <ClubsPointsTable circuit={circuit} category={undefined} />
                </TabsContent>
                <TabsContent value="categories">
                  <PlayerPointsTable
                    circuit={circuit}
                    category={undefined}
                    filter={true}
                  />
                </TabsContent>
              </Tabs>
            )}
            {circuit.type === "default" && (
              <PlayerPointsTable
                circuit={circuit}
                category={undefined}
                filter={false}
              />
            )}
          </TabsContent>
        </div>
      ))}
    </Tabs>
  );
}

const getColumns = (
  phases: CircuitPhase[],
  circuitType: string
): ColumnDef<CircuitPlayer>[] => {
  if (circuitType === "school") {
    return circuitSchoolSubcomponentColumns(phases);
  }
  return circuitTotalColumns(phases);
};

const PlayerPointsTable = ({
  circuit,
  category,
  filter,
}: {
  circuit: Circuit;
  category?: string;
  filter: boolean;
}) => {
  const resetTableState = React.useCallback(() => {
    window.dispatchEvent(new Event("resize"));
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    resetTableState();
  }, [circuit.name, category, resetTableState]);

  const data = aggregatePlayerPoints(circuit, category);
  const columns = getColumns(circuit.circuitPhase, circuit.type);

  data.sort((a, b) => (b.total || 0) - (a.total || 0));

  if (filter) {
    return (
      <div className="mt-3">
        <DataTableSchool data={data} columns={columns} />
      </div>
    );
  }

  return (
    <div className="mt-3">
      <DataTable data={data} columns={columns} />
    </div>
  );
};

type CategoryTypes = string | string[] | undefined;

const aggregatePlayerPoints = (
  circuit: Circuit,
  category?: CategoryTypes
): CircuitPlayer[] => {
  const playerPointsMap = new Map<string, CircuitPlayer>();

  for (const phase of circuit.circuitPhase) {
    for (const podium of phase.circuitPodiums) {
      const categoryMatch =
        !category ||
        (Array.isArray(category)
          ? category.includes(podium.category)
          : podium.category === category);

      if (categoryMatch) {
        const playerName = podium.player.name;
        const points = podium.points || 0;

        if (!playerPointsMap.has(playerName)) {
          playerPointsMap.set(playerName, {
            id: podium.player.id,
            name: podium.player.name,
            nickname: podium.player.nickname,
            imageUrl: podium.player.imageUrl,
            playersToTitles: podium.player.playersToTitles,
            total: 0,
            category: podium.category,
            type: circuit.type,
            pointsByPhase: {},
          });
        }

        const playerPoints = playerPointsMap.get(playerName);
        if (playerPoints) {
          playerPoints.pointsByPhase[phase.tournament.name] = points;
          playerPoints[phase.tournament.name] = points;
          playerPoints.total = (playerPoints.total || 0) + points;
        }
      }
    }
  }

  return Array.from(playerPointsMap.values());
};

const aggregateClubPoints = (
  circuit: Circuit,
  category?: CategoryTypes
): CircuitClub[] => {
  const clubPointsMap = new Map<string, CircuitClub>();
  const playerPointsMap = new Map<string, CircuitPlayer>();

  for (const phase of circuit.circuitPhase) {
    for (const podium of phase.circuitPodiums) {
      const categoryMatch =
        !category ||
        (Array.isArray(category)
          ? category.includes(podium.category)
          : podium.category === category);

      if (categoryMatch) {
        const clubName = podium.player.club?.name || "Unknown Club";
        const points = podium.points || 0;

        if (!clubPointsMap.has(clubName)) {
          clubPointsMap.set(clubName, {
            clubId: podium.player.club?.id || 0,
            clubName: clubName,
            clubLogo: podium.player.club?.logo || "",
            total: 0,
            pointsByPhase: {},
            players: [],
          });
        }

        const clubPoints = clubPointsMap.get(clubName);
        if (clubPoints) {
          clubPoints.pointsByPhase[phase.tournament.name] =
            (clubPoints.pointsByPhase[phase.tournament.name] || 0) + points;
          clubPoints.total += points;

          if (!playerPointsMap.has(podium.player.id as unknown as string)) {
            playerPointsMap.set(podium.player.id as unknown as string, {
              id: podium.player.id,
              name: podium.player.name,
              nickname: podium.player.nickname,
              imageUrl: podium.player.imageUrl,
              playersToTitles: podium.player.playersToTitles,
              total: 0,
              clubName: clubName,
              category: podium.category,
            });
          }

          const playerPoints = playerPointsMap.get(
            podium.player.id as unknown as string
          );
          if (playerPoints) {
            playerPoints.total = (playerPoints.total || 0) + points;
          }
        }
      }
    }
  }

  for (const club of clubPointsMap.values()) {
    for (const player of playerPointsMap.values()) {
      if (player.clubName === club.clubName) {
        club.players.push(player);
      }
    }
    club.players.sort(
      (a: CircuitPlayer, b: CircuitPlayer) => (b.total || 0) - (a.total || 0)
    );
  }

  return Array.from(clubPointsMap.values());
};

const aggregatePoints = (
  circuit: Circuit,
  category?: CategoryTypes
): CircuitPlayer[] | CircuitClub[] => {
  if (circuit.type === "school") {
    return aggregateClubPoints(circuit, category);
  }
  return aggregatePlayerPoints(circuit, category);
};

const ClubsPointsTable = ({
  circuit,
  category,
}: {
  circuit: Circuit;
  category?: string;
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const combinedCategories = category
    ? [...new Set([...selectedCategories, category])]
    : selectedCategories;

  const data = aggregatePoints(
    circuit,
    combinedCategories.length > 0 ? combinedCategories : undefined
  );

  if (!Array.isArray(data) || !data.every(isClubPoints)) {
    return <div>Ops, algo deu errado.</div>;
  }

  const columns = circuitClubsColumns(circuit.circuitPhase);

  const filteredData = data.filter(
    (club) =>
      combinedCategories.length === 0 ||
      club.players.some((player: { category: string }) =>
        combinedCategories.includes(player.category || "")
      )
  );

  filteredData.sort((a, b) => b.total - a.total);

  const renderSubComponent = ({ row }: { row: Row<CircuitClub> }) => {
    const filteredPlayers = row.original.players.filter(
      (player: { category: string }) =>
        selectedCategories.length === 0 ||
        selectedCategories.includes(player.category || "")
    );

    const filteredCircuit: Circuit = {
      name: circuit.name,
      type: circuit.type,
      circuitPhase: circuit.circuitPhase.map((phase) => ({
        ...phase,
        circuitPodiums: phase.circuitPodiums.filter((podium) =>
          filteredPlayers.some(
            (player: CircuitPlayer) => player.id === podium.player.id
          )
        ),
      })),
    };

    return (
      <div className="[&>div>div>div>table>tbody>tr>td:first-child]:!text-center [&>div>div>div>table>tbody>tr>td]:!text-left [&>div>div>div>table>tbody>tr>td:first-child]:!rounded-none [&>div>div>div>table>thead>tr>td:first-child]:!rounded-none [&>div>div>div>table>tbody>tr>td:last-child]:!rounded-none [&>div>div>div>table>thead>tr>td:last-child]:!rounded-none [&>div>div>table>tbody>tr]:!bg-transparent [&>div>div>table>thead>tr]:!bg-transparent w-[calc(100%+20px)] -ml-3 -mt-6 mb-3">
        <PlayerPointsTable
          circuit={filteredCircuit}
          category={undefined}
          filter={false}
        />
      </div>
    );
  };

  return (
    <div>
      <CategoryFilter
        categories={categories}
        selectedCategories={selectedCategories}
        onCategoryChange={setSelectedCategories}
      />
      <DataTable
        data={filteredData}
        columns={columns}
        getRowCanExpand={() => true}
        renderSubComponent={renderSubComponent}
      />
    </div>
  );
};

function isClubPoints(item: CircuitClub | CircuitPlayer): item is CircuitClub {
  return (
    item &&
    typeof item.clubId === "number" &&
    typeof item.clubName === "string" &&
    typeof item.clubLogo === "string" &&
    typeof item.total === "number" &&
    typeof item.pointsByPhase === "object" &&
    Array.isArray(item.players)
  );
}
