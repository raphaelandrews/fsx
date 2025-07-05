import {
	HomeIcon,
	type LucideIcon,
	DatabaseIcon,
	TreePalmIcon,
	StickyNoteIcon,
} from "lucide-react"

type NavigationItem = {
	label: string
	href: string
	icon: LucideIcon
	description?: string
	items?: NavigationItem[]
}

type Navigation = () => NavigationItem[]

export const navigationData: Navigation = () => [
	{
		label: "Dashboard",
		href: "/dashboard",
		icon: HomeIcon,
	},
	{
		label: "Posts",
		href: "/dashboard/posts",
		icon: StickyNoteIcon,
	},
	{
		label: "Rating Update",
		href: "/rating-update",
		icon: DatabaseIcon,
	},
	{
		label: "🏝️",
		href: "/dashboard/user",
		icon: TreePalmIcon,
	},
]
