import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EntityForm } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useAdminMutation } from "@/lib/admin-mutations";
import { LINK_GROUP_SECTIONS } from "@/lib/admin-forms";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/links/create")({
  head: () => ({ meta: [{ title: "New link group - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.links.create.mutationOptions(), {
    invalidates: "links",
    success: "Group created. Add its links below.",
    failure: "Failed to create group",
    onSuccess: (created) => {
      const id = created[0]?.id;
      return id
        ? navigate({ to: "/dashboard/links/$id", params: { id } })
        : navigate({ to: "/dashboard/links" });
    },
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/links"
        backLabel="Links"
        title="New link group"
        description="Name the group first; you add its links on the next page."
      />
      <EntityForm
        sections={LINK_GROUP_SECTIONS}
        defaultValues={{ label: "" }}
        onSubmit={(values) => createMutation.mutate({ label: values.label! })}
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create group"
        cancelTo="/dashboard/links"
      />
    </>
  );
}
