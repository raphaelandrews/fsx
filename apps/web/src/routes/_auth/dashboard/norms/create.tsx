import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EntityForm } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useAdminMutation } from "@/lib/admin-mutations";
import { NORM_SECTIONS } from "@/lib/admin-forms";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/norms/create")({
  head: () => ({ meta: [{ title: "New norm - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.norms.create.mutationOptions(), {
    invalidates: "norms",
    success: "Norm created",
    failure: "Failed to create norm",
    onSuccess: () => navigate({ to: "/dashboard/norms" }),
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/norms"
        backLabel="Norms"
        title="New norm"
        description="Add a norm toward a state title."
      />
      <EntityForm
        sections={NORM_SECTIONS}
        defaultValues={{ name: "" }}
        onSubmit={(values) => createMutation.mutate({ name: values.name! })}
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create norm"
        cancelTo="/dashboard/norms"
      />
    </>
  );
}
