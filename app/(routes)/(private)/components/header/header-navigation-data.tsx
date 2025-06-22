import {
  HomeIcon,
  type LucideIcon,
  DatabaseIcon,
  DatabaseZapIcon,
  TreePalmIcon,
} from "lucide-react";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  items?: NavigationItem[];
};

type Navigation = () => NavigationItem[];

export const navigationData: Navigation = () => [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
  },
  {
    label: "Create Players Data",
    href: "/create-players-data",
    icon: DatabaseIcon,
  },
  {
    label: "Create Players Tournament",
    href: "/create-players-tournament",
    icon: DatabaseIcon,
  },
  {
    label: "Update Players",
    href: "/update-players",
    icon: DatabaseZapIcon,
  },
  {
    label: "🏝️",
    href: "/user",
    icon: TreePalmIcon,
  },
];
