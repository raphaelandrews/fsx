import type { ComponentProps } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  NewsIcon,
  Megaphone01Icon,
  Calendar01Icon,
  Medal01Icon,
  SchoolIcon,
  ChampionIcon,
  Route01Icon,
  Award01Icon,
  UserGroupIcon,
  File01Icon,
  Building01Icon,
  MapPinIcon,
  Link01Icon,
  Download01Icon,
  Database01Icon,
  User02Icon,
} from "@hugeicons/core-free-icons";

export type AdminNavItem = {
  label: string;
  to: string;
  icon: ComponentProps<typeof HugeiconsIcon>["icon"];
  items?: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavItem[] = [
  {
    label: "Overview",
    to: "/dashboard",
    icon: Home01Icon,
    items: [
      { label: "Dashboard", to: "/dashboard", icon: Home01Icon },
      { label: "Rating Update", to: "/rating-update", icon: Route01Icon },
    ],
  },
  {
    label: "Content",
    to: "/dashboard/posts",
    icon: NewsIcon,
    items: [
      { label: "Posts", to: "/dashboard/posts", icon: NewsIcon },
      { label: "Announcements", to: "/dashboard/announcements", icon: Megaphone01Icon },
      { label: "Events", to: "/dashboard/events", icon: Calendar01Icon },
    ],
  },
  {
    label: "Competition",
    to: "/dashboard/tournaments",
    icon: Route01Icon,
    items: [
      { label: "Tournaments", to: "/dashboard/tournaments", icon: Route01Icon },
      { label: "Championships", to: "/dashboard/championships", icon: ChampionIcon },
      { label: "Podiums", to: "/dashboard/tournament-podiums", icon: Medal01Icon },
      { label: "Circuits", to: "/dashboard/circuits", icon: MapPinIcon },
      { label: "TV Sergipe", to: "/dashboard/tv-sergipe", icon: SchoolIcon },
    ],
  },
  {
    label: "Players",
    to: "/dashboard/players",
    icon: User02Icon,
    items: [
      { label: "Players", to: "/dashboard/players", icon: User02Icon },
      { label: "Titles", to: "/dashboard/titles", icon: Award01Icon },
      { label: "Roles", to: "/dashboard/roles", icon: UserGroupIcon },
      { label: "Norms", to: "/dashboard/norms", icon: File01Icon },
      { label: "Insignias", to: "/dashboard/insignias", icon: Award01Icon },
    ],
  },
  {
    label: "Entities",
    to: "/dashboard/clubs",
    icon: Building01Icon,
    items: [
      { label: "Clubs", to: "/dashboard/clubs", icon: Building01Icon },
      { label: "Locations", to: "/dashboard/locations", icon: MapPinIcon },
      { label: "Links", to: "/dashboard/links", icon: Link01Icon },
    ],
  },
  {
    label: "System",
    to: "/dashboard/user",
    icon: Database01Icon,
    items: [
      { label: "Swiss Manager", to: "/dashboard/swiss-manager", icon: Download01Icon },
      { label: "Cache", to: "/dashboard/cache", icon: Database01Icon },
      { label: "Backup", to: "/dashboard/backup", icon: Download01Icon },
      { label: "Account", to: "/dashboard/user", icon: User02Icon },
    ],
  },
];
