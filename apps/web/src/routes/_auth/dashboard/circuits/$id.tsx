import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { toast } from "sonner";
import z from "zod";

import { FormField } from "@/components/form/form-field";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/circuits/$id")({
  head: () => ({ meta: [{ title: "Edit Circuit - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.circuits.listSimple.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: circuits = [] } = useSuspenseQuery(trpc.circuits.listSimple.queryOptions());
  const circuit = circuits.find((c) => c.id === numId);

  const updateMutation = useMutation({
    ...trpc.circuits.update.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.circuits.listSimple.queryFilter());
      toast.success("Circuit updated");
    },
    onError: () => toast.error("Failed to update circuit"),
  });

  if (!circuit) return <p>Circuit not found.</p>;

  const form = useForm({
    defaultValues: {
      name: circuit.name,
      type: circuit.type as "default" | "categories" | "school",
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Name is required"),
        type: z.enum(["default", "categories", "school"]),
      }),
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({
        id: numId,
        name: value.name,
        type: value.type as "default" | "categories" | "school",
      });
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Circuit</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/circuits" })}>
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
        <form.Field name="type">
          {(f) => (
            <FormField label="Type" htmlFor={f.name} error={f.state.meta.errors[0]?.message}>
              <select
                id={f.name}
                value={f.state.value}
                onChange={(e) =>
                  f.handleChange(e.target.value as "default" | "categories" | "school")
                }
                onBlur={f.handleBlur}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="default">Default</option>
                <option value="categories">Categories</option>
                <option value="school">School</option>
              </select>
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
