import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AdminPageHeader } from "@/components/admin/page-header";
import { TvSergipeForm, toTvSergipeInput } from "@/components/admin/tv-sergipe-form";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/tv-sergipe/create")({
  head: () => ({ meta: [{ title: "New School Games result - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.tvSergipe.create.mutationOptions(), {
    invalidates: "tvSergipe",
    success: "Result created",
    failure: "Failed to create result",
    onSuccess: () => navigate({ to: "/dashboard/tv-sergipe" }),
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/tv-sergipe"
        backLabel="TV Sergipe"
        title="New result"
        description="Record a placement in the TV Sergipe School Games."
      />
      <TvSergipeForm
        defaultValues={{
          clubId: "",
          modality: "individual",
          playerId: "",
          teamName: "A",
          ageGroup: "8",
          sex: "male",
          place: "1",
        }}
        onSubmit={(values) => createMutation.mutate(toTvSergipeInput(values))}
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create result"
        cancelTo="/dashboard/tv-sergipe"
      />
    </>
  );
}
