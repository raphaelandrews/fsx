import {
  MoonIcon,
  SunIcon,
  LaptopIcon,
  type LucideIcon,
  CloudyIcon,
  LeafIcon,
  PaletteIcon,
} from "lucide-react";

import { type ThemeStyle, type ColorScheme, useTheme } from "./theme-provider";
import { ClientOnly } from "~/components/client-only";
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
  { value: "peach", label: "Peach", icon: SunIcon },
];

const colorSchemes: Array<{
  value: ColorScheme;
  label: string;
  icon: LucideIcon;
}> = [
  { value: "system", label: "System", icon: LaptopIcon },
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
];

export function ThemeSwitcher() {
  const { theme, colorScheme, setTheme, setColorScheme } = useTheme();
  const CurrentThemeIcon =
    themes.find((t) => t.value === theme)?.icon || PaletteIcon;

  return (
    <ClientOnly
      fallback={
        <Button variant="ghost" size="icon">
          <PaletteIcon size={16} />
        </Button>
      }
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <CurrentThemeIcon size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="flex flex-col gap-0.5">
            {themes.map((t) => (
              <DropdownMenuItem
                key={`theme-${t.value}`}
                onClick={() => setTheme(t.value)}
                className={theme === t.value ? "bg-accent" : ""}
              >
                <t.icon size={16} />
                {t.label}
              </DropdownMenuItem>
            ))}
          </div>
          <DropdownMenuSeparator />
          <div className="flex flex-col gap-0.5">
            {colorSchemes.map((s) => (
              <DropdownMenuItem
                key={`scheme-${s.value}`}
                onClick={() => setColorScheme(s.value)}
                className={colorScheme === s.value ? "bg-accent" : ""}
              >
                <s.icon size={16} />
                {s.label}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </ClientOnly>
  );
}
