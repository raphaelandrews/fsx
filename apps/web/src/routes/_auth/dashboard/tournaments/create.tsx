import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityForm, optional, optionalNumber } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useAdminMutation } from "@/lib/admin-mutations";
import { tournamentSections } from "@/lib/admin-forms";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/tournaments/create")({
  head: () => ({ meta: [{ title: "New tournament - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.champions.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { data: championships } = useSuspenseQuery(trpc.champions.list.queryOptions());

  const createMutation = useAdminMutation(trpc.tournaments.create.mutationOptions(), {
    invalidates: "tournaments",
    success: "Tournament created",
    failure: "Failed to create tournament",
    onSuccess: () => navigate({ to: "/dashboard/tournaments" }),
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/tournaments"
        backLabel="Tournaments"
        title="New tournament"
        description="Create the tournament before importing its rating results or podiums."
      />
      <EntityForm
        sections={tournamentSections(championships)}
        defaultValues={{
          name: "",
          date: "",
          ratingType: "rapid",
          championshipId: "",
          chessResults: "",
        }}
        onSubmit={(values) =>
          createMutation.mutate({
            name: values.name!,
            date: optional(values.date!),
            ratingType: values.ratingType as "blitz" | "rapid" | "classic",
            championshipId: optionalNumber(values.championshipId!),
            chessResults: optional(values.chessResults!),
          })
        }
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create tournament"
        cancelTo="/dashboard/tournaments"
      />
    </>
  );
}
