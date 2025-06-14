"use client";

import { MainNav } from "./main-nav";
import { Separator } from "@/components/ui/separator";
import { ThemeSwitcher } from "@/components/theme-switcher";

export function Toolbar() {

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-background rounded-xl shadow-lg border p-3">
      <div className="flex items-center">
        <MainNav />

        <Separator className="mx-2 !w-0.5 !h-4" orientation="vertical" />

        <ThemeSwitcher />
      </div>
    </div>
  );
}
