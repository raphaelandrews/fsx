import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/admin-shell";
import { PageSkeleton } from "@/components/skeletons/page-skeleton";
import { getUser } from "@/functions/get-user";
import { buildSeo, withBrand } from "@/lib/seo";

export const Route = createFileRoute("/_auth")({
  head: () =>
    buildSeo({
      title: withBrand("Admin dashboard"),
      description: "Restricted area of the Federação Sergipana de Xadrez.",
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

function AuthLayout() {
  const { session } = Route.useRouteContext();
  return (
    <AdminShell user={session.user}>
      <Outlet />
    </AdminShell>
  );
}

function AuthLayoutPending() {
  return (
    <AdminShell>
      <PageSkeleton />
    </AdminShell>
  );
}
