import { Outlet, createFileRoute, lazyRouteComponent, redirect } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/admin-shell";
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
  errorComponent: lazyRouteComponent(() => import("@/components/admin/auth-boundary"), "AuthError"),
  // Preserve the admin chrome while the session check / route loaders run, so
  // entering the panel doesn't drop to a bare full-page spinner.
  pendingComponent: lazyRouteComponent(() => import("@/components/admin/auth-boundary"), "AuthPending"),
  beforeLoad: async () => {
    const { getUser } = await import("@/server/get-user");
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
