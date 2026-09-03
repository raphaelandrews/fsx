import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { toast } from "sonner";
import z from "zod";

import { FormField } from "@/components/form/form-field";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/locations/$id")({
  head: () => ({ meta: [{ title: "Edit Location - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.locations.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: locations = [] } = useSuspenseQuery(trpc.locations.list.queryOptions());
  const location = locations.find((l) => l.id === numId);

  const updateMutation = useMutation({
    ...trpc.locations.update.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.locations.list.queryFilter());
      toast.success("Location updated");
    },
    onError: () => toast.error("Failed to update location"),
  });

  if (!location) {
    return <p>Location not found.</p>;
  }

  const form = useForm({
    defaultValues: { name: location.name, type: location.type, flagUrl: location.flagUrl ?? "" },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Name is required"),
        type: z.string().min(1, "Type is required"),
        flagUrl: z.string(),
      }),
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({
        id: numId,
        name: value.name,
        type: value.type,
        flagUrl: value.flagUrl || null,
      });
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Location</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/locations" })}>
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
            <FormField
              label="Type"
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
        <form.Field name="flagUrl">
          {(f) => (
            <FormField label="Flag URL" htmlFor={f.name} error={f.state.meta.errors[0]?.message}>
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
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
