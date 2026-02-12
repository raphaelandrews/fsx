import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Announcement } from "@/components/announcement"
import { DottedY } from "../dotted-y"

interface Props {
	label?: string
	className?: string
	href?: string
	icon: LucideIcon
	main: boolean
	children: React.ReactNode
}

export function Section({
	label,
	className,
	href,
	icon,
	main,
	children,
}: Props) {
	return (
		<section className={cn(className)}>
			{!main && <Announcement href={href} icon={icon} label={label} />}

			<div className="max-w-[720px] mx-2 sm:mx-8 md:mx-auto relative p-3">{children}</div>
			<DottedY />
		</section>
	)
}
