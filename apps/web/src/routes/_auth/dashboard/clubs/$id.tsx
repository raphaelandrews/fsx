import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import z from "zod";

import { FormField } from "@/components/form/form-field";
import { useTRPC } from "@/utils/trpc";
import { useAdminMutation } from "@/lib/admin-mutations";
import { idParams } from "@/lib/route-params";
import { fieldError } from "@/lib/errors";

export const Route = createFileRoute("/_auth/dashboard/clubs/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit Club - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.clubs.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const { id: numId } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: clubs = [] } = useSuspenseQuery(trpc.clubs.list.queryOptions());
  const club = clubs.find((c) => c.id === numId);

  const updateMutation = useAdminMutation(trpc.clubs.update.mutationOptions(), {
    invalidates: "clubs",
    success: "Club updated",
    failure: "Failed to update club",
    reloadOnConflict: true,
  });

  if (!club) {
    return <p>Club not found.</p>;
  }

  const form = useForm({
    defaultValues: { name: club.name, logoUrl: club.logoUrl ?? "" },
    validators: {
      onSubmit: z.object({ name: z.string().min(1, "Name is required"), logoUrl: z.string() }),
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({ id: numId, name: value.name, logoUrl: value.logoUrl || null });
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Club</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/clubs" })}>
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
        <form.Field name="logoUrl">
          {(f) => (
            <FormField label="Logo URL" htmlFor={f.name} error={fieldError(f, updateMutation.error)}>
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
    </div>
  );
}
