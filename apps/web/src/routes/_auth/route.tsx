import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { AdminHeader } from "@/components/header/admin-header";
import { PageSkeleton } from "@/components/skeletons/page-skeleton";
import { getUser } from "@/functions/get-user";
import { buildSeo, withBrand } from "@/lib/seo";

export const Route = createFileRoute("/_auth")({
  head: () =>
    buildSeo({
      title: withBrand("Painel administrativo"),
      description: "Área restrita da Federação Sergipana de Xadrez.",
      path: "/dashboard",
      noindex: true,
      canonical: false,
    }),
  component: AuthLayout,
  // Preserve the admin chrome while the session check / route loaders run, so
  // entering the panel doesn't drop to a bare full-page spinner.
  pendingComponent: AuthLayoutPending,
  beforeLoad: async () => {
    const session = await getUser();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    return { session };
  },
});

function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AdminHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}

function AuthLayout() {
  return (
    <AuthShell>
      <Outlet />
    </AuthShell>
  );
}

function AuthLayoutPending() {
  return (
    <AuthShell>
      <PageSkeleton />
    </AuthShell>
  );
}
