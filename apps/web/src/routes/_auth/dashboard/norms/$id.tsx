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

export const Route = createFileRoute("/_auth/dashboard/norms/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit Norm - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.norms.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const { id: numId } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: norms = [] } = useSuspenseQuery(trpc.norms.list.queryOptions());
  const norm = norms.find((n) => n.id === numId);

  const updateMutation = useAdminMutation(trpc.norms.update.mutationOptions(), {
    invalidates: "norms",
    success: "Norm updated",
    failure: "Failed to update norm",
    reloadOnConflict: true,
  });

  if (!norm) {
    return <p>Norm not found.</p>;
  }

  const form = useForm({
    defaultValues: { name: norm.name },
    validators: {
      onSubmit: z.object({ name: z.string().min(1, "Norm is required") }),
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({ id: numId, name: value.name });
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Norm</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/norms" })}>
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
              label="Norm"
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
