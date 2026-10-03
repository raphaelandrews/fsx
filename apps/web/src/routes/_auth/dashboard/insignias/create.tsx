import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EntityForm } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useAdminMutation } from "@/lib/admin-mutations";
import { INSIGNIA_SECTIONS } from "@/lib/admin-forms";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/insignias/create")({
  head: () => ({ meta: [{ title: "New insignia - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.insignias.create.mutationOptions(), {
    invalidates: "insignias",
    success: "Insignia created",
    failure: "Failed to create insignia",
    onSuccess: () => navigate({ to: "/dashboard/insignias" }),
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/insignias"
        backLabel="Insignias"
        title="New insignia"
        description="Add a badge players can earn."
      />
      <EntityForm
        sections={INSIGNIA_SECTIONS}
        defaultValues={{ name: "", level: "1" }}
        onSubmit={(values) =>
          createMutation.mutate({ name: values.name!, level: Number(values.level) })
        }
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create insignia"
        cancelTo="/dashboard/insignias"
      />
    </>
  );
}
