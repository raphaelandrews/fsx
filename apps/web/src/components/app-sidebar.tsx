import type * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowUpCircleIcon,
  BookmarkIcon,
  ChartNoAxesColumnIcon,
  HelpCircleIcon,
  HomeIcon,
  MedalIcon,
  MegaphoneIcon,
  NewspaperIcon,
  ScrollIcon,
  SearchIcon,
  SettingsIcon,
  StoreIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";

import { ModeToggle } from "@/components/mode-toggle";
import { NavInfo } from "@/components/nav-info";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: HomeIcon,
    },
    {
      title: "Notícias",
      url: "/noticias",
      icon: NewspaperIcon,
    },
    {
      title: "Rating",
      url: "/rating",
      icon: ChartNoAxesColumnIcon,
    },
    {
      title: "Circuitos",
      url: "/circuitos",
      icon: MedalIcon,
    },
  ],
  highlights: [
    {
      name: "Comunicados",
      url: "/comunicados",
      icon: MegaphoneIcon,
    },
    {
      name: "Campeões",
      url: "/campeoes",
      icon: TrophyIcon,
    },
    {
      name: "Titulados",
      url: "/titulados",
      icon: BookmarkIcon,
    },
  ],
  institutional: [
    {
      name: "Clubes",
      url: "/clubes",
      icon: StoreIcon,
    },
    {
      name: "Membros",
      url: "/membros",
      icon: UsersIcon,
    },
    {
      name: "Sobre",
      url: "/sobre",
      icon: ScrollIcon,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: SettingsIcon,
    },
    {
      title: "Get Help",
      url: "#",
      icon: HelpCircleIcon,
    },
    {
      title: "Search",
      url: "#",
      icon: SearchIcon,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link
                to="/"
                activeProps={{
                  className: "font-bold",
                }}
              >
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-xl font-bold">FSX</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavInfo title="Destaques" items={data.highlights} />
        <NavInfo title="Institucional" items={data.institutional} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <ModeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
