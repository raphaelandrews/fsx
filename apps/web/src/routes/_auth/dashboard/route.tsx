import { Outlet, createFileRoute } from "@tanstack/react-router";

import { ErrorFallback } from "@/components/not-found";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardLayout,
  errorComponent: () => <ErrorFallback homeHref="/dashboard" homeLabel="Voltar ao painel" />,
});

function DashboardLayout() {
  return <Outlet />;
}
