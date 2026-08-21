import { Outlet, createFileRoute } from "@tanstack/react-router";

import { Header } from "@/components/header/header";
import { Footer } from "@/components/footer";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <>
      <Header />
      <main className="container max-w-7xl min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
