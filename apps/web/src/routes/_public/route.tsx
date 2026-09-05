import { Outlet, createFileRoute } from "@tanstack/react-router";

import { Header } from "@/components/header/header";
import { Footer } from "@/components/footer";
import { ErrorFallback } from "@/components/not-found";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
  errorComponent: () => <ErrorFallback homeHref="/" homeLabel="Voltar ao início" />,
});

function PublicLayout() {
  return (
    <>
      <Header />
      <main className="container max-w-5xl! min-h-dvh">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
