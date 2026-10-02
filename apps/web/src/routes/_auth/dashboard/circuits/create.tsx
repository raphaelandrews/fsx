import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";

import { CIRCUIT_TYPE_LABELS, CIRCUIT_TYPES, type CircuitType } from "@fsx/api/circuit-types";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";

import { useTRPC } from "@/utils/trpc";
import { getUserErrorMessage } from "@/lib/errors";
import { useInvalidateAdmin } from "@/lib/admin-mutations";

export const Route = createFileRoute("/_auth/dashboard/circuits/create")({
  head: () => ({ meta: [{ title: "Create Circuit - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const invalidateAdmin = useInvalidateAdmin();

  const createMutation = useMutation({
    ...trpc.circuits.create.mutationOptions(),
    onSuccess: () => {
      void invalidateAdmin("circuits");
      toast.success("Circuito criado");
      navigate({ to: "/dashboard/circuits" });
    },
    onError: (error) => toast.error(getUserErrorMessage(error, "Não foi possível criar o circuito.")),
  });

  const form = useForm({
    defaultValues: { name: "", type: "default" as CircuitType },
    onSubmit: ({ value }) => {
      createMutation.mutate({ name: value.name, type: value.type });
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Nome é obrigatório"),
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
              <Label htmlFor={f.name}>Nome</Label>
              <Input
                id={f.name}
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
              {f.state.meta.errors.map((e) => (
                <p key={e?.message} className="text-destructive text-xs">
                  {e?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>
        <form.Field name="type">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Tipo</Label>
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
            </div>
          )}
        </form.Field>
        <form.Subscribe
          selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting || createMutation.isPending}>
              {isSubmitting ? "Criando..." : "Criar circuito"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
