import { InfoIcon } from "lucide-react";
import { DataTableRowSkeleton } from "~/components/ui/data-table-row-skeleton";
import { DataTableToolbarSkeleton } from "~/components/ui/data-table-toolbar-skeleton";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";

export function CircuitTableSkeleton() {
  return (
    <Tabs>
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 mb-4">
        <TabsList>
          <TabsTrigger value="classic" className="w-20 sm:w-24">
            Despertar
          </TabsTrigger>
          <TabsTrigger value="rapid" className="w-20 sm:w-24">
            Escolar
          </TabsTrigger>
          <TabsTrigger value="blitz" className="w-20 sm:w-24">
            Imperial
          </TabsTrigger>
        </TabsList>
        <InfoIcon className="h-4 w-4 text-primary" />
      </div>

      <DataTableToolbarSkeleton />
      <table className="w-full">
        <tbody>
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
          <DataTableRowSkeleton />
        </tbody>
      </table>
    </Tabs>
  );
}
