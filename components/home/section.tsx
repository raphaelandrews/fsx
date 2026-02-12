import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { Announcement } from "@/components/announcement"
import { DottedSeparator } from "@/components/dotted-separator"

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
			{!main && <Announcement icon={icon} label={label} />}

			{children}

			<DottedSeparator />
		</section>
	)
}
