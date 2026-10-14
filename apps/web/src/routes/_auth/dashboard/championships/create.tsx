import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EntityCreatePage, entityMessages } from "@/components/admin/entity-pages";
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
    ...entityMessages("championship").create,
    onSuccess: () => navigate({ to: "/dashboard/championships" }),
  });

  return (
    <EntityCreatePage
      noun="championship"
      basePath="/dashboard/championships"
      backLabel="Championships"
      description="Add a recurring competition."
      sections={CHAMPIONSHIP_SECTIONS}
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
