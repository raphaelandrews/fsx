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
      <div className="mx-2 sm:mx-8 md:mx-auto relative p-3">
        <main className="min-h-[60vh]">
          <Outlet />
        </main>
      </div>
      <Footer />
    </>
  );
}
