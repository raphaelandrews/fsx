import { DataTableRowSkeleton } from "~/components/ui/data-table-row-skeleton";
import { DataTableToolbarSkeleton } from "~/components/ui/data-table-toolbar-skeleton";

export function DataTableSkeleton() {
  return (
    <>
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
    </>
  );
}
