import { createFileRoute, Outlet } from "@tanstack/react-router";

import { Footer } from "~/components/footer";
import { Header } from "~/components/header";

export const Route = createFileRoute("/_default")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Header />
      <div className="container relative pt-2 min-h-[calc(100dvh-8.25rem)] sm:min-h-[calc(100dvh-7.5rem)]">
        <Outlet />
      </div>
      <Footer />
    </>
  );
}
