import type { AppRouter } from "@fsx/api/routers/index";
import { Toaster } from "@fsx/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { FormDevtoolsPanel } from "@tanstack/react-form-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";

import { SECURITY_HEADERS } from "@fsx/api/security-headers";

import appCss from "../index.css?url";
import { ErrorFallback, NotFound } from "@/components/not-found";
export interface RouterAppContext {
  trpc: TRPCOptionsProxy<AppRouter>;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  headers: () => SECURITY_HEADERS,
  head: () => {
    const analyticsToken = (import.meta as { env?: Record<string, string | undefined> }).env
      ?.VITE_CLOUDFLARE_ANALYTICS_TOKEN
    const scripts = analyticsToken
      ? [
        {
          src: "https://static.cloudflareinsights.com/beacon.min.js",
          defer: true,
          "data-cf-beacon": JSON.stringify({ token: analyticsToken }),
        },
      ]
      : []
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "Federação Sergipana de Xadrez" },
        {
          name: "description",
          content:
            "Site oficial da Federação Sergipana de Xadrez. Ratings, torneios, notícias e campeões do xadrez sergipano.",
        },
        { property: "og:title", content: "Federação Sergipana de Xadrez" },
        {
          property: "og:description",
          content: "Ratings, torneios, notícias e campeões do xadrez sergipano.",
        },
        { property: "og:image", content: "/logo.svg" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
        { name: "view-transition", content: "same-origin" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", type: "image/svg+xml", href: "/logo.svg" },
        { rel: "canonical", href: "https://fsx.chess" },
        { rel: "sitemap", type: "application/xml", href: "/sitemap.xml" },
      ],
      scripts,
    }
  },
  notFoundComponent: () => <NotFound />,
  errorComponent: ({ error }) => {
    console.error("[fsx:ssr-error]", error);
    return <ErrorFallback />;
  },
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Toaster richColors />
        {import.meta.env.DEV && (
          <TanStackDevtools
            plugins={[
              { name: "TanStack Query", render: <ReactQueryDevtoolsPanel /> },
              { name: "TanStack Router", render: <TanStackRouterDevtoolsPanel /> },
              { name: "TanStack Form", render: <FormDevtoolsPanel /> },
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  );
}
