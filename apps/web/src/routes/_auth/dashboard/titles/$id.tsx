import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { toast } from "sonner";
import z from "zod";

import { FormField } from "@/components/form/form-field";
import { useTRPC } from "@/utils/trpc";

const TITLE_TYPES = ["internal", "external"] as const;

export const Route = createFileRoute("/_auth/dashboard/titles/$id")({
  head: () => ({ meta: [{ title: "Edit Title - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.titles.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: titles = [] } = useSuspenseQuery(trpc.titles.list.queryOptions());
  const title = titles.find((t) => t.id === numId);

  const updateMutation = useMutation({
    ...trpc.titles.update.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.titles.list.queryFilter());
      toast.success("Title updated");
    },
    onError: () => toast.error("Failed to update title"),
  });

  if (!title) {
    return <p>Title not found.</p>;
  }

  const form = useForm({
    defaultValues: {
      name: title.name,
      shortName: title.shortName,
      type: title.type as (typeof TITLE_TYPES)[number],
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Title is required"),
        shortName: z.string(),
        type: z.enum(TITLE_TYPES),
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
        <h1 className="font-bold text-2xl">Edit Title</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/titles" })}>
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
              label="Title"
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
            <FormField label="Short Title" htmlFor={f.name} error={f.state.meta.errors[0]?.message}>
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
                onChange={(e) => f.handleChange(e.target.value as (typeof TITLE_TYPES)[number])}
                onBlur={f.handleBlur}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {TITLE_TYPES.map((t) => (
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
