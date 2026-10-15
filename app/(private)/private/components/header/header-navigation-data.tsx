import {
	HomeIcon,
	type LucideIcon,
	DatabaseIcon,
	TreePalmIcon,
	StickyNoteIcon,
	UserIcon,
	CalendarIcon,
	MegaphoneIcon,
	BuildingIcon,
	MapPinIcon,
	LinkIcon,
	AwardIcon,
	DownloadIcon,
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
		label: "Titles",
		href: "/private/dashboard/players/titles",
		icon: AwardIcon,
	},
	{
		label: "Events",
		href: "/private/dashboard/events",
		icon: CalendarIcon,
	},
	{
		label: "Links",
		href: "/private/dashboard/links",
		icon: LinkIcon,
	},
	{
		label: "Announcements",
		href: "/private/dashboard/announcements",
		icon: MegaphoneIcon,
	},
	{
		label: "Clubs",
		href: "/private/dashboard/clubs",
		icon: BuildingIcon,
	},
	{
		label: "Locations",
		href: "/private/dashboard/locations",
		icon: MapPinIcon,
	},
	{
		label: "Backup",
		href: "/private/dashboard/backup",
		icon: DownloadIcon,
	},
	{
		label: "Cache",
		href: "/private/dashboard/cache",
		icon: DatabaseIcon,
	},
	{
		label: "Rating Update",
		href: "/private/rating-update",
		icon: DatabaseIcon,
	},
	{
		label: "🏝",
		href: "/private/dashboard/user",
		icon: TreePalmIcon,
	},
]
