import { UserIcon, TargetIcon, InfoIcon, TrendingUpIcon, Link2Icon, BarChart3Icon, CalendarRangeIcon } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/ui/page-header"
import { DottedX } from "@/components/dotted-x"
import { Announcement } from "@/components/announcement"
import { DottedSeparator } from "@/components/dotted-separator"

export default function Loading() {
	return (
		<div className="mx-auto w-full max-w-[720px]">
			<PageHeader icon={UserIcon} label="Perfil">
				<DottedX className="p-0">
					{/* Header Section */}
					<div className="relative">
						<Skeleton className="h-32 w-full" />
						<div className="px-4 pb-4">
							<div className="-mt-12 mb-4 flex justify-center">
								<Skeleton className="h-24 w-24 rounded-[20px] border-4 border-background" />
							</div>

							<div className="flex flex-col items-center gap-2">
								<Skeleton className="h-7 w-48" />
								<div className="flex gap-2">
									<Skeleton className="h-5 w-16 rounded-full" />
									<Skeleton className="h-5 w-20 rounded-full" />
								</div>
							</div>
						</div>
						<DottedSeparator className="w-full" />
					</div>

					{/* Conquistas Section */}
					<section className="mb-0">
						<Announcement icon={TargetIcon} label="Conquistas" className="text-sm" />
						<div className="p-3">
							<div className="flex flex-wrap gap-2 justify-center sm:justify-start">
								<Skeleton className="h-8 w-20 rounded-md" />
								<Skeleton className="h-8 w-16 rounded-md" />
								<Skeleton className="h-8 w-24 rounded-md" />
								<Skeleton className="h-8 w-18 rounded-md" />
							</div>
						</div>
						<DottedSeparator className="w-full" />
					</section>

					{/* Informações Section */}
					<section className="mb-0">
						<Announcement icon={InfoIcon} label="Informações" className="text-sm" />

						<div className="flex flex-col">
							{Array.from({ length: 4 }).map((_, index) => (
								<div key={index}>
									{index > 0 && <DottedSeparator className="w-full" />}
									<div className="m-1">
										<div className="flex flex-col sm:flex-row sm:items-center justify-between p-3">
											<Skeleton className="h-4 w-24" />
											<Skeleton className="h-4 w-32 mt-1 sm:mt-0" />
										</div>
									</div>
								</div>
							))}
						</div>

						<DottedSeparator className="w-full" />
					</section>

					{/* Ratings Section */}
					<section className="mb-0">
						<Announcement icon={TrendingUpIcon} label="Ratings" className="text-sm" />

						<div className="grid grid-cols-3 divide-x divide-border">
							{["Clássico", "Rápido", "Blitz"].map((label) => (
								<div key={label} className="p-4 flex flex-col items-center justify-center">
									<span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
									<Skeleton className="h-7 w-12 mt-1" />
								</div>
							))}
						</div>

						<DottedSeparator className="w-full" />
					</section>

					{/* IDs Section */}
					<section className="mb-0">
						<Announcement icon={Link2Icon} label="Identificação" className="text-sm" />

						<div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-y sm:divide-y-0 divide-border">
							{["ID FSX", "ID CBX", "ID FIDE"].map((label) => (
								<div key={label} className="p-4 flex flex-col items-center justify-center">
									<span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
									<Skeleton className="h-5 w-16 mt-1" />
								</div>
							))}
						</div>

						<DottedSeparator className="w-full" />
					</section>

					{/* Performance Section */}
					<section className="mb-0">
						<div className="flex items-center justify-between pr-3">
							<Announcement icon={BarChart3Icon} label="Performance" className="text-sm flex-1" />
							<Skeleton className="w-[140px] h-8 rounded-md" />
						</div>

						<div className="p-4 space-y-6">
							<div className="space-y-2">
								<Skeleton className="h-4 w-32 ml-2" />
								<Skeleton className="h-[200px] w-full rounded-md" />
							</div>

							<DottedSeparator className="w-full" />

							<div className="space-y-2">
								<Skeleton className="h-4 w-36 ml-2" />
								<Skeleton className="h-[200px] w-full rounded-md" />
							</div>
						</div>
						<DottedSeparator className="w-full" />
					</section>

					{/* Torneios Section */}
					<section className="mb-0">
						<Announcement icon={CalendarRangeIcon} label="Histórico de Torneios" className="text-sm" />
						<div className="p-0">
							<Skeleton className="h-64 w-full" />
						</div>
					</section>
				</DottedX>
			</PageHeader>
		</div>
	)
}
