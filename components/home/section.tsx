import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Announcement } from "@/components/announcement"

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
		<section className={cn(className, "my-10")}>
			{!main && <Announcement href={href} icon={icon} label={label} />}

			<div className="mt-3">{children}</div>
		</section>
	)
}
