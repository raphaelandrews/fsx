import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { optionalNumber } from "@/components/admin/entity-form";
import { EntityCreatePage, entityMessages } from "@/components/admin/entity-pages";
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
    ...entityMessages("title").create,
    onSuccess: () => navigate({ to: "/dashboard/titles" }),
  });

  return (
    <EntityCreatePage
      noun="title"
      basePath="/dashboard/titles"
      backLabel="Titles"
      description="Add a title players can hold."
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
    />
  );
}
