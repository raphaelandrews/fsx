import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AdminHeader } from "@/components/header/admin-header";
import { Footer } from "@/components/footer";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AdminHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </div>
      </main>
      <Footer className="max-w-[1120px]" />
    </div>
  );
}
