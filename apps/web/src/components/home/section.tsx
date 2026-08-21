import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@fsx/ui/lib/utils"

import type { IconSvgObject } from "@/lib/icon-types"

import { Announcement } from "@/components/announcement"

interface Props {
	label?: string
	className?: string
	icon: IconSvgObject
	main: boolean
	children: React.ReactNode
}

export function Section({
	label,
	className,
	icon,
	main,
	children,
}: Props) {
	return (
		<section className={cn(className)}>
			<div className="mx-2 sm:mx-8 md:mx-auto relative p-0">
				{!main && <Announcement icon={icon} label={label} />}
				{main && (
					<div className="p-3">
						<div className="inline-block rounded-md bg-primary-foreground p-2.5 text-muted-foreground">
							<HugeiconsIcon icon={icon} className="size-4" />
						</div>
					</div>
				)}
				{children}
			</div>
		</section>
	)
}
