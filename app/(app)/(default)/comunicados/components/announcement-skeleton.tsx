"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function AnnouncementSkeleton() {
	return (
		<div className="grid gap-1.5 md:grid-cols-2">
			{Array.from({ length: 12 }, (_, i) => `announcement-skeleton-${i}`).map(
				(id) => (
					<Skeleton className="h-9 w-full rounded-md" key={id} />
				),
			)}
		</div>
	)
}
