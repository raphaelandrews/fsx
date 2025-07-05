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
		href: "/private/dashboard",
		icon: HomeIcon,
	},
	{
		label: "Posts",
		href: "/private/dashboard/posts",
		icon: StickyNoteIcon,
	},
	{
		label: "Rating Update",
		href: "/private/rating-update",
		icon: DatabaseIcon,
	},
	{
		label: "🏝️",
		href: "/private/dashboard/user",
		icon: TreePalmIcon,
	},
]
