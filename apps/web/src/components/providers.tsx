
import type * as React from "react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@fsx/ui/components/sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
    >
      {children}
      <Toaster />
    </ThemeProvider>
  )
}
