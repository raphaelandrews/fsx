import {
  Moon,
  Sun,
  Palette,
  Laptop,
  type LucideIcon,
  CloudyIcon,
  LeafIcon,
  PaletteIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { type ThemeStyle, type ColorScheme, useTheme } from "./theme-provider";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

const themes: Array<{ value: ThemeStyle; label: string; icon: LucideIcon }> = [
  { value: "default", label: "Default", icon: PaletteIcon },
  { value: "mint", label: "Mint", icon: LeafIcon },
  { value: "sky", label: "Sky", icon: CloudyIcon },
  { value: "peach", label: "Peach", icon: Sun },
];

const colorSchemes: Array<{
  value: ColorScheme;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "system", label: "System", icon: Laptop },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export function ThemeSwitcher() {
  const { theme, colorScheme, setTheme, setColorScheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const CurrentThemeIcon =
    themes.find((t) => t.value === theme)?.icon || Palette;

  if (!mounted) {
    return (
      <Button variant="outline" size="icon">
        <Palette className="h-[1.2rem] w-[1.2rem]" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <CurrentThemeIcon className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((t) => (
          <DropdownMenuItem
            key={`theme-${t.value}`}
            onClick={() => setTheme(t.value)}
            className={theme === t.value ? "bg-accent" : ""}
          >
            <t.icon className="mr-2 h-4 w-4" />
            {t.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {colorSchemes.map((s) => (
          <DropdownMenuItem
            key={`scheme-${s.value}`}
            onClick={() => setColorScheme(s.value)}
            className={colorScheme === s.value ? "bg-accent" : ""}
          >
            <s.icon className="mr-2 h-4 w-4" />
            {s.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
