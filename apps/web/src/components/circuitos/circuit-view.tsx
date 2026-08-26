import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";
import { Tabs, TabsList, TabsTrigger } from "@fsx/ui/components/tabs";

import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";

import { aggregateClubs, aggregatePlayers, circuitCategories, phaseNames } from "./aggregate";
import { ClubsTable } from "./clubs-table";
import { PlayersTable } from "./players-table";
import type { Circuit } from "./types";

export function CircuitView({ circuit }: { circuit: Circuit }) {
  const phases = useMemo(() => phaseNames(circuit), [circuit]);

  if (circuit.type === "categories") {
    return <CategoriesView circuit={circuit} phases={phases} />;
  }
  if (circuit.type === "school") {
    return <SchoolView circuit={circuit} phases={phases} />;
  }
  return <PlayersTable rows={aggregatePlayers(circuit)} phases={phases} />;
}

function CategoriesView({ circuit, phases }: { circuit: Circuit; phases: string[] }) {
  const categories = useMemo(() => circuitCategories(circuit), [circuit]);
  const [active, setActive] = useState<string | null>(categories[0] ?? null);

  if (categories.length === 0) {
    return <PlayersTable rows={aggregatePlayers(circuit)} phases={phases} />;
  }

  const rows = useMemo(
    () => (active ? aggregatePlayers(circuit, [active]) : []),
    [circuit, active],
  );

  return (
    <div className="space-y-4">
      <Tabs
        className="w-full"
        onValueChange={(value) => setActive(value)}
        value={active ?? undefined}
      >
        <div className="flex justify-center">
          <TabsList>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
      <PlayersTable rows={rows} phases={phases} />
    </div>
  );
}

function SchoolView({ circuit, phases }: { circuit: Circuit; phases: string[] }) {
  const categories = useMemo(() => circuitCategories(circuit), [circuit]);
  const [view, setView] = useState<"clubes" | "jogadores">("clubes");
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          className="w-fit"
          onValueChange={(value) => setView(value as "clubes" | "jogadores")}
          value={view}
        >
          <TabsList>
            <TabsTrigger value="clubes">Clubes</TabsTrigger>
            <TabsTrigger value="jogadores">Jogadores</TabsTrigger>
          </TabsList>
        </Tabs>

        {categories.length > 0 ? (
          <div className="flex items-center gap-2">
            <DataTableFacetedFilter
              onChange={setSelected}
              options={categories.map((category) => ({
                label: category,
                value: category,
              }))}
              title="Categoria"
              value={selected}
            />
            {selected.length > 0 ? (
              <Button className="h-8 px-2 lg:px-3" onClick={() => setSelected([])} variant="ghost">
                Limpar
                <HugeiconsIcon className="ml-2 size-4" icon={Cancel01Icon} strokeWidth={2} />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {view === "clubes" ? (
        <ClubsTable rows={aggregateClubs(circuit, selected)} phases={phases} />
      ) : (
        <PlayersTable rows={aggregatePlayers(circuit, selected)} phases={phases} showCategory />
      )}
    </div>
  );
}
