import type { AppRouter } from "@fsx/api/routers/index";
import { Toaster } from "@fsx/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { FormDevtoolsPanel } from "@tanstack/react-form-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";

import appCss from "../index.css?url";
export interface RouterAppContext {
  trpc: TRPCOptionsProxy<AppRouter>;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Federação Sergipana de Xadrez",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  notFoundComponent: () => (
    <div className="container mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-16">
      <h1 className="mb-2 font-bold text-4xl">404</h1>
      <p className="mb-6 text-muted-foreground">Página não encontrada</p>
      <a
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm hover:bg-primary/90"
      >
        Voltar ao início
      </a>
    </div>
  ),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Toaster richColors />
        <TanStackDevtools
          plugins={[
            { name: "TanStack Query", render: <ReactQueryDevtoolsPanel /> },
            { name: "TanStack Router", render: <TanStackRouterDevtoolsPanel /> },
            { name: "TanStack Form", render: <FormDevtoolsPanel /> },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}
