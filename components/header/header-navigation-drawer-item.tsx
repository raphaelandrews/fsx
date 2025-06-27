"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"

export type Item = {
	label: string
	href: string
	icon: LucideIcon
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
}: HeaderNavigationDrawerItemProps) => {
	const pathname = usePathname()

	const getIsActive = (href: string) => {
		return pathname === href
	}

	if (items) {
		return (
			<AccordionItem className="border-none" value={href}>
				<AccordionTrigger className="group rounded-lg px-3 py-2 transition-colors hover:bg-muted/50">
					<div className="flex items-center gap-2 text-sm">
						<Icon
							className="text-muted-foreground group-hover:text-foreground"
							height={16}
							width={16}
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
			href={href}
			key={href}
		>
			<Icon
				className={isActive ? "text-foreground" : "text-muted-foreground"}
				height={16}
				width={16}
			/>
			{label}
		</Link>
	)
}
