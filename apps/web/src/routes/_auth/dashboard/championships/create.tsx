import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EntityForm } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useAdminMutation } from "@/lib/admin-mutations";
import { CHAMPIONSHIP_SECTIONS } from "@/lib/admin-forms";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/championships/create")({
  head: () => ({ meta: [{ title: "New championship - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.champions.create.mutationOptions(), {
    invalidates: "champions",
    success: "Championship created",
    failure: "Failed to create championship",
    onSuccess: () => navigate({ to: "/dashboard/championships" }),
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/championships"
        backLabel="Championships"
        title="New championship"
        description="Add a recurring competition."
      />
      <EntityForm
        sections={CHAMPIONSHIP_SECTIONS}
        defaultValues={{ name: "" }}
        onSubmit={(values) => createMutation.mutate({ name: values.name! })}
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create championship"
        cancelTo="/dashboard/championships"
      />
    </>
  );
}
