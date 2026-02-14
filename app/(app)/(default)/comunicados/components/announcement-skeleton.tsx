import { Fragment } from "react"

import { DottedSeparator } from "@/components/dotted-separator"
import { DottedX } from "@/components/dotted-x"
import { Skeleton } from "@/components/ui/skeleton"

export function AnnouncementSkeleton() {
	return (
		<DottedX className="p-0">
			<div className="flex flex-col">
			{Array.from({ length: 12 }).map((_, index) => (
				<Fragment key={`announcement-skeleton-${index}`}>
					<div className="m-1">
						<div className="flex items-center justify-between p-3 select-none">
							<div className="flex flex-col gap-2 w-full">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Skeleton className="h-4 w-4 rounded-full" />
										<Skeleton className="h-4 w-32 rounded-md" />
									</div>
									<Skeleton className="h-4 w-4 rounded-full" />
								</div>
								<Skeleton className="h-3 w-full rounded-md" />
								<Skeleton className="h-3 w-3/4 rounded-md" />
							</div>
						</div>
					</div>
					{index < 11 && <DottedSeparator className="w-full" />}
				</Fragment>
			))}
			</div>
		</DottedX>
	)
}
