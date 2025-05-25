import type * as React from "react";

import { ThemeProvider } from "./theme-provider";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { indexedDBPersister } from "~/lib/query-client-persister";
import type { QueryClient } from "@tanstack/react-query";

export function Providers({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: indexedDBPersister,
        maxAge: 1000 * 60 * 60 * 24 * 15,
      }}
    >
      <ThemeProvider defaultTheme="default" storageKey="vite-ui-theme">
        {children}
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
