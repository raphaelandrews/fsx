import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

import { buttonVariants } from "@fsx/ui/components/button";

import { AdminPageHeader } from "@/components/admin/page-header";
import { ErrorFallback } from "@/components/not-found";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardLayout,
  errorComponent: () => <ErrorFallback homeHref="/dashboard" homeLabel="Back to dashboard" />,
  notFoundComponent: DashboardNotFound,
});

function DashboardLayout() {
  return <Outlet />;
}

function DashboardNotFound() {
  return (
    <>
      <AdminPageHeader
        backTo="/dashboard"
        backLabel="Dashboard"
        title="Not found"
        description="This record does not exist. It may have been deleted, or the address is wrong."
      />
      <Link to="/dashboard" className={buttonVariants({ variant: "outline" })}>
        Back to dashboard
      </Link>
    </>
  );
}
