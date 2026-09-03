import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { toast } from "sonner";
import z from "zod";

import { FormField } from "@/components/form/form-field";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/norms/$id")({
  head: () => ({ meta: [{ title: "Edit Norm - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.norms.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: norms = [] } = useSuspenseQuery(trpc.norms.list.queryOptions());
  const norm = norms.find((n) => n.id === numId);

  const updateMutation = useMutation({
    ...trpc.norms.update.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.norms.list.queryFilter());
      toast.success("Norm updated");
    },
    onError: () => toast.error("Failed to update norm"),
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
