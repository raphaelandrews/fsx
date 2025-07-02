import { InfoIcon } from "lucide-react"
import { DataTableToolbarSkeleton } from "@/app/(routes)/(default)/ratings/components/data-table-toolbar-skeleton"
import { DataTableSkeletonRow } from "@/app/(routes)/(default)/ratings/components/data-table-skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function CircuitTableSkeleton() {
	return (
		<Tabs>
			<div className="mb-4 flex flex-col items-start gap-3 lg:flex-row lg:items-center">
				<TabsList>
					<TabsTrigger className="w-20 sm:w-24" value="classic">
						Despertar
					</TabsTrigger>
					<TabsTrigger className="w-20 sm:w-24" value="rapid">
						Escolar
					</TabsTrigger>
					<TabsTrigger className="w-20 sm:w-24" value="blitz">
						Imperial
					</TabsTrigger>
				</TabsList>
				<InfoIcon className="h-4 w-4 text-primary" />
			</div>

			<DataTableToolbarSkeleton />
			<table className="w-full">
				<tbody>
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
					<DataTableSkeletonRow />
				</tbody>
			</table>
		</Tabs>
	)
}
