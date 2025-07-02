import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
	return (
		<section className="m-auto w-11/12 max-w-[500px] animate-pulse pt-12 pb-20">
			<div className="mb-12">
				<Skeleton className="h-32 w-full rounded-md" />
				<Skeleton className="-translate-y-1/2 -translate-x-1/2 absolute left-1/2 h-20 w-20 rounded-[10px] border-4 border-background" />
			</div>

			<div className="flex items-center justify-center">
				<Skeleton className="h-7 w-40" />
			</div>

			<div className="mt-8 flex flex-wrap justify-center gap-1.5">
				<Skeleton className="h-10 w-10 rounded-md" />
				<Skeleton className="h-10 w-10 rounded-md" />
			</div>

			<div className="mt-5 space-y-4">
				<div>
					<Skeleton className="mb-1 h-4 w-20 rounded" />
					<Skeleton className="h-5 w-48 rounded" />
				</div>
				<div>
					<Skeleton className="mb-1 h-4 w-24 rounded" />
					<Skeleton className="h-5 w-32 rounded" />
				</div>
				<div>
					<Skeleton className="mb-1 h-4 w-16 rounded" />
					<Skeleton className="h-5 w-40 rounded" />
				</div>
				<div>
					<Skeleton className="mb-1 h-4 w-16 rounded" />
					<Skeleton className="h-5 w-28 rounded" />
				</div>
			</div>

			<div className="mt-3">
				<Skeleton className="mb-2 h-4 w-20 rounded" />
				<div className="grid grid-cols-3 gap-2">
					<Skeleton className="h-20 rounded-md" />
					<Skeleton className="h-20 rounded-md" />
					<Skeleton className="h-20 rounded-md" />
				</div>
				<Skeleton className="mt-4 mb-2 h-4 w-12 rounded" />
				<div className="grid grid-cols-3 gap-2">
					<Skeleton className="h-20 rounded-md" />
					<Skeleton className="h-20 rounded-md" />
					<Skeleton className="h-20 rounded-md" />
				</div>
			</div>

			<div className="mt-4">
				<Skeleton className="mb-1 h-4 w-28 rounded" />
				<Skeleton className="mb-2 h-3 w-32 rounded" />
				<div className="flex justify-end">
					<Skeleton className="mt-2 h-10 w-32" />
				</div>
				<div className="mt-2 space-y-4">
					<Skeleton className="h-[200px] w-full" />
					<Skeleton className="h-[200px] w-full" />
				</div>
			</div>

			<div className="mt-3">
				<Skeleton className="mb-2 h-4 w-24 rounded" />
				<Skeleton className="h-64 w-full" />
			</div>
		</section>
	)
}
