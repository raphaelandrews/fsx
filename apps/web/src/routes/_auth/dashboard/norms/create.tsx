import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EntityCreatePage, entityMessages } from "@/components/admin/entity-pages";
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
    ...entityMessages("norm").create,
    onSuccess: () => navigate({ to: "/dashboard/norms" }),
  });

  return (
    <EntityCreatePage
      noun="norm"
      basePath="/dashboard/norms"
      backLabel="Norms"
      description="Add a norm toward a state title."
      sections={NORM_SECTIONS}
      defaultValues={{ name: "" }}
      onSubmit={(values) =>
        createMutation.mutate({
          name: values.name!,
        })
      }
      error={createMutation.error}
      pending={createMutation.isPending}
    />
  );
}
