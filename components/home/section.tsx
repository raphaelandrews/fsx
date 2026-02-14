import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { Announcement } from "@/components/announcement"
import { DottedSeparator } from "@/components/dotted-separator"
import { DottedX } from "@/components/dotted-x"

interface Props {
	label?: string
	className?: string
	icon: LucideIcon
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
			<DottedX className="p-0">
				{!main && <Announcement icon={icon} label={label} />}
				{children}
			</DottedX>
			<DottedSeparator />
		</section>
	)
}
