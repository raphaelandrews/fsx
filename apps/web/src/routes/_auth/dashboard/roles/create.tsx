import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EntityForm } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useAdminMutation } from "@/lib/admin-mutations";
import { ROLE_SECTIONS } from "@/lib/admin-forms";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/roles/create")({
  head: () => ({ meta: [{ title: "New role - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.roles.create.mutationOptions(), {
    invalidates: "roles",
    success: "Role created",
    failure: "Failed to create role",
    onSuccess: () => navigate({ to: "/dashboard/roles" }),
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/roles"
        backLabel="Roles"
        title="New role"
        description="Add a board, arbiter, or teacher position."
      />
      <EntityForm
        sections={ROLE_SECTIONS}
        defaultValues={{ name: "", shortName: "", type: "management" }}
        onSubmit={(values) =>
          createMutation.mutate({
            name: values.name!,
            shortName: values.shortName!,
            type: values.type as "management" | "referee" | "teacher",
          })
        }
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create role"
        cancelTo="/dashboard/roles"
      />
    </>
  );
}
