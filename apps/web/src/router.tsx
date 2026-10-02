import { appRouter, type AppRouter } from "@fsx/api/routers/index";
import { createContext } from "@fsx/api/context";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import type { TRPCLink } from "@trpc/client";
import { createTRPCClient, httpBatchLink, unstable_localLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { toast } from "sonner";
import { ThemeProvider } from "next-themes";

import { NotFound } from "./components/not-found";
import { PageSkeleton } from "./components/skeletons/page-skeleton";
import { routeTree } from "./routeTree.gen";
import { TRPCProvider } from "./utils/trpc";
import { getUserErrorMessage, isAdminPath, isExpectedQueryError } from "./lib/errors";

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (isExpectedQueryError(error)) return;
        const admin = typeof window !== "undefined" && isAdminPath(window.location.pathname);
        toast.error(
          admin
            ? getUserErrorMessage(error, "Could not load the data.", "en")
            : getUserErrorMessage(error, "Não foi possível carregar os dados."),
          {
            action: {
              label: admin ? "Retry" : "Tentar novamente",
              onClick: () => {
                query.invalidate();
              },
            },
          },
        );
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
      },
    },
  });
}

// The browser talks to the Worker over HTTP. On the server, calling tRPC over
// HTTP to the Worker's own origin is unreliable (self-fetch), so we call the
// router in-process instead — same procedures, no network hop.
const trpcLinks = createIsomorphicFn()
  .client((): TRPCLink<AppRouter>[] => [httpBatchLink({ url: "/api/trpc" })])
  .server((): TRPCLink<AppRouter>[] => [
    unstable_localLink({
      router: appRouter,
      createContext: () => createContext({ req: getRequest() }),
    }),
  ]);

const trpcClient = createTRPCClient<AppRouter>({
  links: trpcLinks(),
});

export const getRouter = () => {
  const queryClient = createQueryClient();
  const trpc = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient,
  });

  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    // React Query is the client-side freshness authority; avoid a second
    // Router preload cache hiding invalidated data.
    defaultPreloadStaleTime: 0,
    defaultPreload: "intent",
    // Wrap route commits in document.startViewTransition. The global CSS keeps
    // the root crossfade disabled, so only elements that opt in with a matching
    // `view-transition-name` morph between pages (shared-element transitions).
    defaultViewTransition: true,
    context: { trpc, queryClient },
    defaultPendingComponent: () => <PageSkeleton />,
    defaultNotFoundComponent: () => <NotFound />,
    Wrap: ({ children }) => (
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          storageKey="fsx-theme"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </TRPCProvider>
    ),
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
