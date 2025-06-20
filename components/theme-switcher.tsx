"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeSwitcher() {
  const { setTheme } = useTheme();

  const themeColors = {
    light: "bg-yellow-300",
    dark: "bg-gray-800",
    mint: "bg-green-400",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="p-2">
          <div className={`w-4 h-4 rounded-full ${themeColors.light}`} />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <div className={`w-4 h-4 rounded-full mr-2 ${themeColors.light}`} />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <div className={`w-4 h-4 rounded-full mr-2 ${themeColors.dark}`} />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("mint")}>
          <div className={`w-4 h-4 rounded-full mr-2 ${themeColors.mint}`} />
          Mint
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
