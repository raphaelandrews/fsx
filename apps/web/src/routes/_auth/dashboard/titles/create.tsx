import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EntityForm, optionalNumber } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useAdminMutation } from "@/lib/admin-mutations";
import { TITLE_SECTIONS } from "@/lib/admin-forms";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/titles/create")({
  head: () => ({ meta: [{ title: "New title - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.titles.create.mutationOptions(), {
    invalidates: "titles",
    success: "Title created",
    failure: "Failed to create title",
    onSuccess: () => navigate({ to: "/dashboard/titles" }),
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/titles"
        backLabel="Titles"
        title="New title"
        description="Add a title players can hold."
      />
      <EntityForm
        sections={TITLE_SECTIONS}
        defaultValues={{ name: "", shortName: "", type: "internal", tier: "1", losesAtAge: "" }}
        onSubmit={(values) =>
          createMutation.mutate({
            name: values.name!,
            shortName: values.shortName!,
            type: values.type as "internal" | "external",
            tier: Number(values.tier),
            losesAtAge: optionalNumber(values.losesAtAge!),
          })
        }
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create title"
        cancelTo="/dashboard/titles"
      />
    </>
  );
}
