import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EntityCreatePage } from "@/components/admin/entity-pages";
import { entityMessages } from "@/lib/entity-routes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { ROLE_SECTIONS } from "@/lib/admin-forms";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_auth/dashboard/roles/create")({
  head: () => ({ meta: [{ title: "New role - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.roles.create.mutationOptions(), {
    invalidates: "roles",
    ...entityMessages("role").create,
    onSuccess: () => navigate({ to: "/dashboard/roles" }),
  });

  return (
    <EntityCreatePage
      noun="role"
      basePath="/dashboard/roles"
      backLabel="Roles"
      description="Add a board, arbiter, or teacher position."
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
    />
  );
}
