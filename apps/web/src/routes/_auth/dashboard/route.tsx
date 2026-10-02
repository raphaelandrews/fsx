import { Outlet, createFileRoute } from "@tanstack/react-router";

import { ErrorFallback } from "@/components/not-found";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardLayout,
  errorComponent: () => <ErrorFallback homeHref="/dashboard" homeLabel="Back to dashboard" />,
});

function DashboardLayout() {
  return <Outlet />;
}
