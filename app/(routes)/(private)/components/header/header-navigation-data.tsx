import {
	HomeIcon,
	type LucideIcon,
	DatabaseIcon,
	DatabaseZapIcon,
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
		label: "Create Players Data",
		href: "/dashboard/players-data",
		icon: DatabaseIcon,
	},
	{
		label: "Create Players Tournament",
		href: "/dashboard/players-tournament",
		icon: DatabaseZapIcon,
	},
	{
		label: "🏝️",
		href: "/dashboard/user",
		icon: TreePalmIcon,
	},
]
