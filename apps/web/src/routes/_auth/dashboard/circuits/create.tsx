import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import z from "zod";

import { CIRCUIT_TYPE_LABELS, CIRCUIT_TYPES, type CircuitType } from "@fsx/api/circuit-types";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";

import { useTRPC } from "@/utils/trpc";
import { useAdminMutation } from "@/lib/admin-mutations";
import { FieldError } from "@/components/form/field-error";

export const Route = createFileRoute("/_auth/dashboard/circuits/create")({
  head: () => ({ meta: [{ title: "Create Circuit - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useAdminMutation(trpc.circuits.create.mutationOptions(), {
    invalidates: "circuits",
    success: "Circuit created",
    failure: "Failed to create circuit",
    onSuccess: () => { navigate({ to: "/dashboard/circuits" }); },
  });

  const form = useForm({
    defaultValues: { name: "", type: "default" as CircuitType },
    onSubmit: ({ value }) => {
      createMutation.mutate({ name: value.name, type: value.type });
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Name is required"),
        type: z.enum(CIRCUIT_TYPES),
      }),
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Criar circuito</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="name">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Name</Label>
              <Input
                id={f.name}
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
              <FieldError field={f} error={createMutation.error} />
            </div>
          )}
        </form.Field>
        <form.Field name="type">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Type</Label>
              <select
                id={f.name}
                value={f.state.value}
                onChange={(e) => f.handleChange(e.target.value as CircuitType)}
                onBlur={f.handleBlur}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CIRCUIT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {CIRCUIT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              <FieldError field={f} error={createMutation.error} />
            </div>
          )}
        </form.Field>
        <form.Subscribe
          selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting || createMutation.isPending}>
              {isSubmitting ? "Creating..." : "Create circuit"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
