"use client";

import * as React from "react";
import {
  Moon,
  Sun,
  Laptop,
  Flower2,
  Leaf,
  Palette,
  Cloud,
  Heart,
  Sparkles,
  Waves,
} from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
  { name: "System", value: "system", icon: Laptop },
  { name: "Dark", value: "dark", icon: Moon },
  { name: "Light", value: "light", icon: Sun },
];

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = themes.find((t) => t.value === theme) || themes[0];
  const Icon = currentTheme?.icon || Laptop;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="border-none shadow-none">
          {mounted ? <Icon className="h-[1.2rem] w-[1.2rem]" /> : null}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((t) => {
          const ThemeIcon = t.icon;
          return (
            <DropdownMenuItem
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={theme === t.value ? "bg-accent" : ""}
            >
              <ThemeIcon size={16} className="mr-2" />
              {t.name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
