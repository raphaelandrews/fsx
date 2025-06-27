"use client"

import type * as React from "react"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"

import { getQueryClient } from "@/hooks/get-query-client"
import { indexedDBPersister } from "@/lib/query-client-persister"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

export function Providers({ children }: { children: React.ReactNode }) {
	const queryClient = getQueryClient()

	return (
		<PersistQueryClientProvider
			client={queryClient}
			persistOptions={{
				persister: indexedDBPersister,
				maxAge: 1000 * 60 * 60 * 24 * 15,
			}}
		>
			<ThemeProvider
				attribute="class"
				defaultTheme="light"
				disableTransitionOnChange
			>
				{children}
				<Toaster />
			</ThemeProvider>
		</PersistQueryClientProvider>
	)
}
