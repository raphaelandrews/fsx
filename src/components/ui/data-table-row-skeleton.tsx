import { Skeleton } from "~/components/ui/skeleton";
import { TableCell, TableRow } from "~/components/ui/table";

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
