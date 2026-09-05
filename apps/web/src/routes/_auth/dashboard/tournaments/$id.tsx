import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { toast } from "sonner";
import z from "zod";

import { FormField } from "@/components/form/form-field";
import { useTRPC } from "@/utils/trpc";

const RATING_TYPES = ["blitz", "rapid", "classic"] as const;

export const Route = createFileRoute("/_auth/dashboard/tournaments/$id")({
  head: () => ({ meta: [{ title: "Edit Tournament - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.tournaments.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: tournaments = [] } = useSuspenseQuery(trpc.tournaments.list.queryOptions());
  const tournament = tournaments.find((t) => t.id === numId);

  const updateMutation = useMutation({
    ...trpc.tournaments.update.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.tournaments.list.queryFilter());
      toast.success("Tournament updated");
    },
    onError: () => toast.error("Failed to update tournament"),
  });

  if (!tournament) {
    return <p>Tournament not found.</p>;
  }

  const form = useForm({
    defaultValues: {
      name: tournament.name,
      chessResults: tournament.chessResults ?? "",
      date: tournament.date ?? "",
      ratingType: tournament.ratingType as (typeof RATING_TYPES)[number],
      championshipId: tournament.championshipId,
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Name is required"),
        chessResults: z.string(),
        date: z.string(),
        ratingType: z.enum(RATING_TYPES),
        championshipId: z.number().nullable(),
      }),
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({
        id: numId,
        name: value.name,
        chessResults: value.chessResults || null,
        date: value.date || null,
        ratingType: value.ratingType,
        championshipId: value.championshipId,
      });
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Tournament</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/tournaments" })}>
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
        <form.Field name="name">
          {(f) => (
            <FormField
              label="Name"
              htmlFor={f.name}
              error={f.state.meta.errors[0]?.message}
              required
            >
              <Input
                id={f.name}
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            </FormField>
          )}
        </form.Field>
        <form.Field name="ratingType">
          {(f) => (
            <FormField label="Rating Type" htmlFor={f.name} error={f.state.meta.errors[0]?.message}>
              <select
                id={f.name}
                value={f.state.value}
                onChange={(e) => f.handleChange(e.target.value as (typeof RATING_TYPES)[number])}
                onBlur={f.handleBlur}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {RATING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </form.Field>
        <form.Field name="date">
          {(f) => (
            <FormField label="Date" htmlFor={f.name} error={f.state.meta.errors[0]?.message}>
              <Input
                id={f.name}
                type="date"
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            </FormField>
          )}
        </form.Field>
        <form.Field name="chessResults">
          {(f) => (
            <FormField
              label="Chess Results URL"
              htmlFor={f.name}
              error={f.state.meta.errors[0]?.message}
            >
              <Input
                id={f.name}
                type="url"
                placeholder="https://..."
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            </FormField>
          )}
        </form.Field>
        <form.Field name="championshipId">
          {(f) => (
            <FormField
              label="Championship ID"
              htmlFor={f.name}
              error={f.state.meta.errors[0]?.message}
            >
              <Input
                id={f.name}
                type="number"
                value={f.state.value?.toString() ?? ""}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value ? Number(e.target.value) : null)}
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
