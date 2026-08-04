"use client"

import { Link } from "@tanstack/react-router"
import { useLocation } from "@tanstack/react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { Home01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@fsx/ui/lib/utils"
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@fsx/ui/components/accordion"

export type Item = {
	label: string
	href: string
	icon: typeof Home01Icon
	target: string
	items?: Item[]
}

export type HeaderNavigationDrawerItemProps = Item & {
	items?: Item[]
}

export const HeaderNavigationDrawerItem = ({
	href,
	icon: Icon,
	label,
	items,
	target,
}: HeaderNavigationDrawerItemProps) => {
	const pathname = useLocation().pathname

	const getIsActive = (href: string) => {
		return pathname === href
	}

	if (items) {
		return (
			<AccordionItem className="border-none" value={href}>
				<AccordionTrigger className="group rounded-lg px-3 py-2 transition-colors hover:bg-muted/50">
					<div className="flex items-center gap-2 text-sm">
						<HugeiconsIcon
							className="text-muted-foreground group-hover:text-foreground"
							icon={Icon}
							size={16}
						/>
						<span className="text-muted-foreground group-hover:text-foreground">
							{label}
						</span>
					</div>
				</AccordionTrigger>

				<AccordionContent className="ml-3 space-y-1 px-3 pb-0">
					{items.map((item) => (
						<HeaderNavigationDrawerItem {...item} key={item.href} />
					))}
				</AccordionContent>
			</AccordionItem>
		)
	}

	const isActive = getIsActive(href)

	return (
		<Link
			className={cn(
				"flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
				isActive
					? "bg-muted font-medium text-foreground"
					: "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
			)}
			to={href}
			key={href}
			target={target}
		>
			<HugeiconsIcon
				className={isActive ? "text-foreground" : "text-muted-foreground"}
				icon={Icon}
				size={16}
			/>
			{label}
		</Link>
	)
}
