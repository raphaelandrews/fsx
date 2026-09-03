import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { toast } from "sonner";
import z from "zod";

import { FormField } from "@/components/form/form-field";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/tournament-podiums/$id")({
  head: () => ({ meta: [{ title: "Edit Podium - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.tournamentPodiums.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: podiums = [] } = useSuspenseQuery(trpc.tournamentPodiums.list.queryOptions());
  const podium = podiums.find((p) => p.id === numId);

  const updateMutation = useMutation({
    ...trpc.tournamentPodiums.update.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.tournamentPodiums.list.queryFilter());
      toast.success("Podium updated");
    },
    onError: () => toast.error("Failed to update podium"),
  });

  if (!podium) {
    return <p>Podium not found.</p>;
  }

  const form = useForm({
    defaultValues: {
      playerId: podium.playerId,
      tournamentId: podium.tournamentId,
      place: podium.place,
    },
    validators: {
      onSubmit: z.object({
        playerId: z.number().min(1, "Player is required"),
        tournamentId: z.number().min(1, "Tournament is required"),
        place: z.number().min(1, "Place is required"),
      }),
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({
        id: numId,
        playerId: value.playerId,
        tournamentId: value.tournamentId,
        place: value.place,
      });
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Podium</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/tournament-podiums" })}>
          Back
        </Button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="playerId">
          {(f) => (
            <FormField
              label="Player ID"
              htmlFor={f.name}
              error={f.state.meta.errors[0]?.message}
              required
            >
              <Input
                id={f.name}
                type="number"
                value={String(f.state.value)}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(Number(e.target.value))}
              />
            </FormField>
          )}
        </form.Field>
        <form.Field name="tournamentId">
          {(f) => (
            <FormField
              label="Tournament ID"
              htmlFor={f.name}
              error={f.state.meta.errors[0]?.message}
              required
            >
              <Input
                id={f.name}
                type="number"
                value={String(f.state.value)}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(Number(e.target.value))}
              />
            </FormField>
          )}
        </form.Field>
        <form.Field name="place">
          {(f) => (
            <FormField
              label="Place"
              htmlFor={f.name}
              error={f.state.meta.errors[0]?.message}
              required
            >
              <Input
                id={f.name}
                type="number"
                value={String(f.state.value)}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(Number(e.target.value))}
              />
            </FormField>
          )}
        </form.Field>
        <form.Subscribe
          selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
