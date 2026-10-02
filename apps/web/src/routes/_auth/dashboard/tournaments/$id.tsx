import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import z from "zod";

import { DatePicker } from "@/components/date-picker";
import { FormField } from "@/components/form/form-field";
import { useTRPC } from "@/utils/trpc";
import { useAdminMutation } from "@/lib/admin-mutations";
import { idParams } from "@/lib/route-params";
import { fieldError, orNotFound } from "@/lib/errors";
import { TournamentRatingResults } from "@/components/rating-update/tournament-rating-results";

const RATING_TYPES = ["blitz", "rapid", "classic"] as const;

export const Route = createFileRoute("/_auth/dashboard/tournaments/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit Tournament - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    Promise.all([
      orNotFound(context.queryClient.ensureQueryData(context.trpc.tournaments.byId.queryOptions({ id: params.id }))),
      context.queryClient.ensureQueryData(
        context.trpc.playersTournament.listByTournament.queryOptions({ tournamentId: params.id }),
      ),
    ]),
  component: RouteComponent,
});

function RouteComponent() {
  const { id: numId } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: tournament } = useSuspenseQuery(trpc.tournaments.byId.queryOptions({ id: numId }));

  const updateMutation = useAdminMutation(trpc.tournaments.update.mutationOptions(), {
    invalidates: "tournaments",
    success: "Tournament updated",
    failure: "Failed to update tournament",
    reloadOnConflict: true,
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
              error={fieldError(f, updateMutation.error)}
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
            <FormField label="Rating Type" htmlFor={f.name} error={fieldError(f, updateMutation.error)}>
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
            <FormField label="Date" htmlFor={f.name} error={fieldError(f, updateMutation.error)}>
              <DatePicker
                id={f.name}
                value={f.state.value}
                onChange={(value) => f.handleChange(value)}
                placeholder="Select a date"
              />
            </FormField>
          )}
        </form.Field>
        <form.Field name="chessResults">
          {(f) => (
            <FormField
              label="Chess Results URL"
              htmlFor={f.name}
              error={fieldError(f, updateMutation.error)}
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
              error={fieldError(f, updateMutation.error)}
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
            <Button type="submit" disabled={!canSubmit || isSubmitting || updateMutation.isPending}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <TournamentRatingResults tournamentId={numId} />
    </div>
  );
}
