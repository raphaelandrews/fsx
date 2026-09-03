import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { toast } from "sonner";
import z from "zod";

import { FormField } from "@/components/form/form-field";
import { useTRPC } from "@/utils/trpc";

const ROLE_TYPES = ["management", "referee", "teacher"] as const;

export const Route = createFileRoute("/_auth/dashboard/roles/$id")({
  head: () => ({ meta: [{ title: "Edit Role - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.roles.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: roles = [] } = useSuspenseQuery(trpc.roles.list.queryOptions());
  const role = roles.find((r) => r.id === numId);

  const updateMutation = useMutation({
    ...trpc.roles.update.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.roles.list.queryFilter());
      toast.success("Role updated");
    },
    onError: () => toast.error("Failed to update role"),
  });

  if (!role) {
    return <p>Role not found.</p>;
  }

  const form = useForm({
    defaultValues: {
      name: role.name,
      shortName: role.shortName,
      type: role.type as (typeof ROLE_TYPES)[number],
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Role is required"),
        shortName: z.string(),
        type: z.enum(ROLE_TYPES),
      }),
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({
        id: numId,
        name: value.name,
        shortName: value.shortName,
        type: value.type,
      });
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Role</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/roles" })}>
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
              label="Role"
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
        <form.Field name="shortName">
          {(f) => (
            <FormField label="Short Role" htmlFor={f.name} error={f.state.meta.errors[0]?.message}>
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
                onChange={(e) => f.handleChange(e.target.value as (typeof ROLE_TYPES)[number])}
                onBlur={f.handleBlur}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {ROLE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
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
