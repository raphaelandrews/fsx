import { Skeleton } from "@/components/ui/skeleton"

export function DataTableToolbarSkeleton() {
	return (
		<div className="flex items-center justify-between">
			<div className="flex flex-1 flex-col items-start space-y-2 md:flex-row md:items-center md:space-x-2 md:space-y-0">
				<Skeleton className="h-8 w-[150px] lg:w-[250px]" />

				<div className="flex flex-1 flex-col items-start space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
					<Skeleton className="h-8 w-[100px]" />
					<Skeleton className="h-8 w-[100px]" />
					<Skeleton className="h-8 w-[100px]" />
					<Skeleton className="h-8 w-[100px]" />
					<Skeleton className="h-8 w-[100px]" />
					<Skeleton className="h-8 w-[90px]" />
				</div>
			</div>
		</div>
	)
}
