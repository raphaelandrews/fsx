import { TableCell, TableRow } from "~/components/ui/table";
import { Skeleton } from "~/components/ui/skeleton";

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

export function DataTableToolbarSkeleton() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col md:flex-row flex-1 items-start md:items-center space-y-2 md:space-y-0 md:space-x-2">
        <Skeleton className="h-8 w-[150px] lg:w-[250px]" />

        <div className="flex flex-col sm:flex-row flex-1 items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[100px]" />
          <Skeleton className="h-8 w-[90px]" />
        </div>
      </div>
    </div>
  );
}

export function DataTableRowSkeleton() {
  return (
    <TableRow>
      <TableCell className="flex justify-center items-center h-12">
        <Skeleton className="h-4 w-4 rounded" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-4 w-[120px] rounded" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-12 rounded" />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-[100px] rounded" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-[100px] rounded" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-12 rounded" />
      </TableCell>
    </TableRow>
  );
}
