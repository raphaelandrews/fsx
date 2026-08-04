import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@fsx/ui/lib/utils"

import type { IconSvgObject } from "@/lib/icon-types"

import { Announcement } from "@/components/announcement"
import { DottedSeparator } from "@/components/dotted-separator"
import { DottedX } from "@/components/dotted-x"

interface Props {
	label?: string
	className?: string
	icon: IconSvgObject
	main: boolean
	children: React.ReactNode
	hideSeparator?: boolean
}

export function Section({
	label,
	className,
	icon,
	main,
	children,
	hideSeparator = false,
}: Props) {
	return (
		<section className={cn(className)}>
			<DottedX className="p-0">
				{!main && <Announcement icon={icon} label={label} />}
				{main && (
					<div className="p-3">
						<div className="inline-block rounded-md bg-primary-foreground p-2.5 text-muted-foreground">
							<HugeiconsIcon icon={icon} className="size-4" />
						</div>
					</div>
				)}
				{children}
			</DottedX>
			{!hideSeparator && <DottedSeparator />}
		</section>
	)
}
