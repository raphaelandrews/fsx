import { Outlet, createFileRoute } from "@tanstack/react-router";

import { ErrorFallback, NotFound } from "@/components/not-found";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardLayout,
  errorComponent: ({ error }) => (
    <ErrorFallback error={error} locale="en" homeHref="/dashboard" homeLabel="Back to dashboard" />
  ),
  notFoundComponent: () => <NotFound />,
});

function DashboardLayout() {
  return <Outlet />;
}
