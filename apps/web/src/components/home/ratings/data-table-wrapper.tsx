import { Suspense } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/data-table";

const SKELETON_KEYS = Array.from({ length: 8 }, (_, i) => `skeleton-${i}`)

function TableLoadingSkeleton() {
	return (
		<div className="animate-pulse bg-muted rounded-lg h-96 p-4">
			<div className="h-8 bg-muted-foreground/10 rounded mb-4" />
			<div className="space-y-2">
				{SKELETON_KEYS.map((key) => (
					<div key={key} className="h-6 bg-muted-foreground/10 rounded" />
				))}
			</div>
		</div>
	)
}

export function DataTableWrapper<TData, TValue>({
  columns,
  data,
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}) {
  return (
    <Suspense fallback={<TableLoadingSkeleton />}>
      <DataTable columns={columns} data={data} />
    </Suspense>
  );
}
