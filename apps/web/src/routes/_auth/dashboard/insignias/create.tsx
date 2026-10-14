import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { EntityCreatePage } from "@/components/admin/entity-pages";
import { entityMessages } from "@/lib/entity-routes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { INSIGNIA_SECTIONS } from "@/lib/admin-forms";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_auth/dashboard/insignias/create")({
  head: () => ({ meta: [{ title: "New insignia - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.insignias.create.mutationOptions(), {
    invalidates: "insignias",
    ...entityMessages("insignia").create,
    onSuccess: () => navigate({ to: "/dashboard/insignias" }),
  });

  return (
    <EntityCreatePage
      noun="insignia"
      basePath="/dashboard/insignias"
      backLabel="Insignias"
      description="Add a badge players can earn."
      sections={INSIGNIA_SECTIONS}
      defaultValues={{ name: "", level: "1" }}
      onSubmit={(values) =>
        createMutation.mutate({
          name: values.name!,
          level: Number(values.level),
        })
      }
      error={createMutation.error}
      pending={createMutation.isPending}
    />
  );
}
