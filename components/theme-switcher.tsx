"use client";

import * as React from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const themes = [
    {
      name: "light",
      color: "bg-linear-to-r from-gray-300 via-zinc-400 to-stone-500",
    },
    {
      name: "dark",
      color: "bg-linear-to-r from-stone-800 via-zinc-600 to-gray-400",
    },
    {
      name: "mint",
      color: "bg-linear-to-r from-teal-900 via-emerald-700 to-green-500",
    },
  ];

  const currentTheme = themes.find((t) => t.name === theme) || themes[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="p-2">
          {mounted ? (
            <div className={`w-4 h-4 rounded-full ${currentTheme.color}`} />
          ) : null}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto">
        {themes.map(({ name, color }) => (
          <DropdownMenuItem key={name} onClick={() => setTheme(name)}>
            <div className={`w-4 h-4 rounded-full ${color}`} />
            {name.charAt(0).toUpperCase() + name.slice(1)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
