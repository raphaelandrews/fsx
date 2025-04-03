import {
  Link,
  Outlet,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import type { QueryClient } from "@tanstack/react-query";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
  notFoundComponent: () => {
    return (
      <div>
        <p>This is the notFoundComponent configured on root route</p>
        <Link to="/">Start Over</Link>
      </div>
    );
  },
});

function RootComponent() {
  return (
    <>
      <Header />
      <div className="container relative xl:!max-w-[1400px] min-h-[calc(100vh-9.5rem)]">
        <Outlet />
      </div>
      <Footer className="container flex-col justify-between md:flex-row" />
      <ReactQueryDevtools buttonPosition="top-right" />
      <TanStackRouterDevtools position="bottom-right" />
    </>
  );
}
