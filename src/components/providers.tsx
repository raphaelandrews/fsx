import type * as React from "react";

import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="default" storageKey="vite-ui-theme">
      {children}
    </ThemeProvider>
  );
}
