"use client";

import { MainNav } from "./main-nav";
import { Separator } from "@/components/ui/separator";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { UpdateRegister } from "../update-register";
import { SearchPlayers } from "./search-players";

export function Toolbar() {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-background dark:bg-[#0F0F0F] rounded-xl shadow-md px-2.5 py-2 z-50">
      <div className="flex items-center">
        <MainNav />

        <Separator className="mx-2 !w-0.5 !h-4" orientation="vertical" />

        <SearchPlayers />

        <Separator className="mx-2 !w-0.5 !h-4" orientation="vertical" />

        <UpdateRegister />

        <Separator className="mx-2 !w-0.5 !h-4" orientation="vertical" />

        <ThemeSwitcher />
      </div>
    </div>
  );
}
