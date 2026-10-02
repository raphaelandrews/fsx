import type { AppRouter } from "@fsx/api/routers/index";
import { Toaster } from "@fsx/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { FormDevtoolsPanel } from "@tanstack/react-form-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { MotionConfig } from "motion/react";

import { SECURITY_HEADERS } from "@fsx/api/security-headers";

import appCss from "../index.css?url";
import { ErrorFallback, NotFound } from "@/components/not-found";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_SHORT_NAME,
  SITE_URL,
  THEME_COLOR,
  absoluteUrl,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
export interface RouterAppContext {
  trpc: TRPCOptionsProxy<AppRouter>;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  headers: () => SECURITY_HEADERS,
  head: () => {
    const analyticsToken = (import.meta as { env?: Record<string, string | undefined> }).env
      ?.VITE_CLOUDFLARE_ANALYTICS_TOKEN;
    const scripts = [
      ...(analyticsToken
        ? [
            {
              src: "https://static.cloudflareinsights.com/beacon.min.js",
              defer: true,
              "data-cf-beacon": JSON.stringify({ token: analyticsToken }),
            },
          ]
        : []),
      {
        type: "application/ld+json",
        children: JSON.stringify(organizationJsonLd()),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(websiteJsonLd()),
      },
    ];
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: THEME_COLOR },
        { title: SITE_NAME },
        { name: "description", content: DEFAULT_DESCRIPTION },
        { name: "robots", content: "index, follow" },
        { name: "application-name", content: SITE_SHORT_NAME },
        { name: "apple-mobile-web-app-title", content: SITE_SHORT_NAME },
        { property: "og:title", content: SITE_NAME },
        { property: "og:description", content: DEFAULT_DESCRIPTION },
        { property: "og:type", content: "website" },
        { property: "og:url", content: SITE_URL },
        { property: "og:image", content: absoluteUrl(DEFAULT_OG_IMAGE) },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:site_name", content: SITE_NAME },
        { property: "og:locale", content: SITE_LOCALE },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: SITE_NAME },
        { name: "twitter:description", content: DEFAULT_DESCRIPTION },
        { name: "twitter:image", content: absoluteUrl(DEFAULT_OG_IMAGE) },
        { name: "view-transition", content: "same-origin" },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: "/favicon.ico", sizes: "any" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "manifest", href: "/site.webmanifest" },
        { rel: "sitemap", type: "application/xml", href: "/sitemap.xml" },
      ],
      scripts,
    };
  },
  notFoundComponent: () => <NotFound />,
  errorComponent: ({ error }) => {
    if (typeof document !== "undefined") console.error(error);
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
        <MotionConfig reducedMotion="user">
          <Outlet />
        </MotionConfig>
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
