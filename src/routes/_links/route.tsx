import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Footer } from "~/components/footer";

export const Route = createFileRoute("/_links")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="before:content-[''] before:block before:fixed before:bg-[length:200px_auto] before:bg-[url('/noise.webp')] before:opacity-30 before:inset-0 before:pointer-events-none before:z-[999999]">
      <main className="flex flex-col items-center gap-6 w-11/12 max-w-[500px] min-h-screen pt-12 mx-auto my-0">
        <Outlet />
      </main>
      <Footer className="justify-center w-11/12 max-w-[500px]" />
    </div>
  );
}
