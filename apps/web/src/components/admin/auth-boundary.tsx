import type { ErrorComponentProps } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/admin-shell";
import { ErrorFallback } from "@/components/not-found";
import { RoutePending } from "@/components/skeletons/route-pending";

// Kept out of the route module so the public pages' entry chunk does not import the admin shell.
export function AuthPending() {
  return (
    <AdminShell>
      <RoutePending />
    </AdminShell>
  );
}

export function AuthError({ error }: ErrorComponentProps) {
  return (
    <AdminShell>
      <ErrorFallback error={error} locale="en" homeHref="/dashboard" homeLabel="Back to dashboard" />
    </AdminShell>
  );
}
