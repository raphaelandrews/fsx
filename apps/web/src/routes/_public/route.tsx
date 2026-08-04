import { Outlet, createFileRoute } from "@tanstack/react-router";

import { Header } from "@/components/header/header";
import { Footer } from "@/components/footer";
import { DottedSeparator } from "@/components/dotted-separator";
import { DottedX } from "@/components/dotted-x";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <>
      <Header />
      <DottedSeparator />
      <DottedX>
        <main className="min-h-[60vh]">
          <Outlet />
        </main>
      </DottedX>
      <Footer />
    </>
  );
}
