import { createContext, useContext, useEffect, useState } from "react";

export type ThemeStyle = "default" | "mint" | "sky" | "peach";
export type ColorScheme = "light" | "dark" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: ThemeStyle;
  defaultColorScheme?: ColorScheme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: ThemeStyle;
  colorScheme: ColorScheme;
  setTheme: (theme: ThemeStyle) => void;
  setColorScheme: (scheme: ColorScheme) => void;
};

const initialState: ThemeProviderState = {
  theme: "default",
  colorScheme: "system",
  setTheme: () => null,
  setColorScheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "default",
  defaultColorScheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeStyle>(() => {
    const saved = localStorage.getItem(`${storageKey}-style`);
    return (saved as ThemeStyle) || defaultTheme;
  });

  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    const saved = localStorage.getItem(`${storageKey}-scheme`);
    return (saved as ColorScheme) || defaultColorScheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    const isDark = colorScheme === "dark" || 
      (colorScheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    root.classList.remove("dark", "default", "mint", "sky", "peach");

    if (theme !== "default") {
      root.classList.add(theme);
    }

    if (isDark) {
      root.classList.add("dark");
    }
  }, [theme, colorScheme]);

  const value = {
    theme,
    colorScheme,
    setTheme: (newTheme: ThemeStyle) => {
      localStorage.setItem(`${storageKey}-style`, newTheme);
      setThemeState(newTheme);
    },
    setColorScheme: (newScheme: ColorScheme) => {
      localStorage.setItem(`${storageKey}-scheme`, newScheme);
      setColorSchemeState(newScheme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
