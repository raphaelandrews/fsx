import { Outlet, createFileRoute } from "@tanstack/react-router";

import { Header } from "@/components/header/header";
import { Footer } from "@/components/footer";
import { ErrorFallback } from "@/components/not-found";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
  errorComponent: ({ error }) => <ErrorFallback error={error} />,
});

function PublicLayout() {
  return (
    <>
      <Header />
      <main className="container max-w-5xl! min-h-dvh pb-16">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
