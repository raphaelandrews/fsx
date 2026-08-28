import type { AppRouter } from "@fsx/api/routers/index";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { toast } from "sonner";
import { ThemeProvider } from "next-themes";

import Loader from "./components/loader";
import { routeTree } from "./routeTree.gen";
import { TRPCProvider } from "./utils/trpc";

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        toast.error(error.message, {
          action: {
            label: "retry",
            onClick: () => {
              query.invalidate();
            },
          },
        });
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

const getSSRRequest = createIsomorphicFn()
  .client(() => undefined)
  .server(() => getRequest());

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      fetch(url, options) {
        const request = getSSRRequest();
        if (request) {
          // On the server, self-fetch the Worker via its canonical workers.dev
          // origin. The custom domain (www.fsx.org.br) still resolves through
          // DNS to the legacy Next.js app, so self-fetching it returns the
          // wrong app (an HTML 404) instead of this Worker's /api/trpc JSON.
          // In dev there is no split, so reuse the request origin (localhost).
          const base = import.meta.env.DEV
            ? request.url
            : "https://fsx-web-raphael.hey-02c.workers.dev";
          url = new URL(url.toString(), base).toString();
          const cookie = request.headers.get("cookie");
          if (cookie) {
            options = {
              ...options,
              headers: { ...options?.headers, cookie },
            };
          }
        }
        return fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
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
    defaultPreloadStaleTime: 60_000,
    defaultPreload: "intent",
    context: { trpc, queryClient },
    defaultPendingComponent: () => <Loader />,
    defaultNotFoundComponent: () => <div>Not Found</div>,
    Wrap: ({ children }) => (
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" storageKey="fsx-theme" disableTransitionOnChange>
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
