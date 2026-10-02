import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { toast } from "sonner";
import z from "zod";

import { FormField } from "@/components/form/form-field";
import { useTRPC } from "@/utils/trpc";
import { useInvalidateAdmin } from "@/lib/admin-mutations";
import { idParams } from "@/lib/route-params";

const TITLE = "Championship";
const DOMAIN = "champions" as const;
const PATH = "/dashboard/championships";

export const Route = createFileRoute("/_auth/dashboard/championships/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: `Edit ${TITLE} - Admin - FSX` }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.champions.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const { id: numId } = Route.useParams();
  const trpc = useTRPC();
  const invalidateAdmin = useInvalidateAdmin();
  const navigate = useNavigate();

  const { data: items = [] } = useSuspenseQuery(trpc[DOMAIN].list.queryOptions());
  const item = items.find((i: any) => i.id === numId);

  const updateMutation = useMutation({
    ...trpc[DOMAIN].update.mutationOptions(),
    onSuccess: () => {
      void invalidateAdmin(DOMAIN);
      toast.success(`${TITLE} updated`);
    },
    onError: () => toast.error(`Failed to update ${TITLE.toLowerCase()}`),
  });

  if (!item) return <p>{TITLE} not found.</p>;

  const form = useForm({
    defaultValues: { name: item.name },
    validators: {
      onSubmit: z.object({ name: z.string().min(1, "Name is required") }),
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({ id: numId, name: value.name });
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit {TITLE}</h1>
        <Button variant="outline" onClick={() => navigate({ to: PATH })}>
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
