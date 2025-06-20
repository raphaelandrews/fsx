"use client";

import type * as React from "react";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
      themes={["light", "dark", "mint"]}
    >
      {children}
    </ThemeProvider>
  );
}
