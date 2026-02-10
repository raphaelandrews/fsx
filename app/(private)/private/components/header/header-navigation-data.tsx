import {
	HomeIcon,
	type LucideIcon,
	DatabaseIcon,
	TreePalmIcon,
	StickyNoteIcon,
	UserIcon,
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
		label: "Players",
		href: "/private/dashboard/players",
		icon: UserIcon,
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
