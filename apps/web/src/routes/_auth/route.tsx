import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { AdminHeader } from "@/components/header/admin-header";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
  beforeLoad: async () => {
    const session = await getUser();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    return { session };
  },
});

function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AdminHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
