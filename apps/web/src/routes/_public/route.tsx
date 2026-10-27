import type { ReactNode } from "react";
import { Outlet, createFileRoute } from "@tanstack/react-router";

import { Header } from "@/components/header/header";
import { Footer } from "@/components/footer";
import { MAIN_ID, SkipLink } from "@/components/skip-link";
import { ErrorFallback, NotFound } from "@/components/not-found";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
  // A route that handles a not-found renders this instead of its layout, so the chrome is repeated.
  notFoundComponent: () => (
    <PublicChrome>
      <NotFound />
    </PublicChrome>
  ),
  errorComponent: ({ error }) => <ErrorFallback error={error} />,
});

function PublicChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <SkipLink />
      <Header />
      <main id={MAIN_ID} tabIndex={-1} className="container max-w-5xl! min-h-dvh pb-16 outline-none">{children}</main>
      <Footer />
    </>
  );
}

function PublicLayout() {
  return (
    <PublicChrome>
      <Outlet />
    </PublicChrome>
  );
}
