import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";

import { LinkIconSelect } from "@/components/link-icon-select";
import { DEFAULT_LINK_ICON } from "@fsx/api/link-icons";
import { useTRPC } from "@/utils/trpc";
import { useInvalidateAdmin } from "@/lib/admin-mutations";
import { showMutationError } from "@/lib/errors";
import { FieldError } from "@/components/form/field-error";

export const Route = createFileRoute("/_auth/dashboard/links/create")({
  head: () => ({ meta: [{ title: "Create Link Group - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const invalidateAdmin = useInvalidateAdmin();

  // Links must exist before the list refreshes, so this flow invalidates last.
  const createGroupMutation = useMutation({
    ...trpc.links.create.mutationOptions(),
    onSuccess: async (data) => {
      toast.success("Group created");
      const groupId = data[0].id;
      const results = await Promise.allSettled(
        links.map((link) =>
          createLinkMutation.mutateAsync({
            href: link.href,
            label: link.label,
            icon: link.icon,
            sortOrder: link.sortOrder,
            linkGroupId: groupId,
          }),
        ),
      );
      if (results.some((result) => result.status === "rejected")) {
        toast.error("Some links could not be created");
      }
      void invalidateAdmin("links");
      navigate({ to: "/dashboard/links" });
    },
    onError: (error) => showMutationError(error, "Failed to create group"),
  });

  const createLinkMutation = useMutation(trpc.links.createLink.mutationOptions());

  const form = useForm({
    defaultValues: {
      label: "",
      links: [] as { href: string; label: string; icon: string; sortOrder: number }[],
    },
    onSubmit: ({ value }) => {
      createGroupMutation.mutate({ label: value.label });
    },
  });

  let links: { href: string; label: string; icon: string; sortOrder: number }[] = [];

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Link Group</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="label">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Group Label</Label>
              <Input
                id={f.name}
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
              <FieldError field={f} error={createGroupMutation.error} />
            </div>
          )}
        </form.Field>

        <div>
          <h3 className="mb-1 font-medium text-sm">Links</h3>
          <p className="mb-2 text-xs text-muted-foreground">
            Deixe a URL em branco para sinalizar que ainda não está disponível ("em breve").
          </p>
          <form.Field name="links">
            {(f) => {
              links = f.state.value;
              return (
                <div className="space-y-2">
                  {f.state.value.map((_, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Label"
                        value={f.state.value[index].label}
                        onChange={(e) => {
                          const next = [...f.state.value];
                          next[index] = { ...next[index], label: e.target.value };
                          f.handleChange(next);
                        }}
                        className="flex-1"
                      />
                      <Input
                        type="url"
                        placeholder="URL (opcional)"
                        value={f.state.value[index].href}
                        onChange={(e) => {
                          const next = [...f.state.value];
                          next[index] = { ...next[index], href: e.target.value };
                          f.handleChange(next);
                        }}
                        className="flex-1"
                      />
                      <LinkIconSelect
                        value={f.state.value[index].icon}
                        onChange={(svg) => {
                          const next = [...f.state.value];
                          next[index] = { ...next[index], icon: svg };
                          f.handleChange(next);
                        }}
                      />
                      <Input
                        placeholder="Sort Order"
                        type="number"
                        value={String(f.state.value[index].sortOrder || 0)}
                        onChange={(e) => {
                          const next = [...f.state.value];
                          next[index] = { ...next[index], sortOrder: Number(e.target.value) };
                          f.handleChange(next);
                        }}
                        className="w-20"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const next = f.state.value.filter((_, i) => i !== index);
                          f.handleChange(next);
                        }}
                      >
                        X
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      f.handleChange([
                        ...f.state.value,
                        {
                          label: "",
                          href: "",
                          icon: DEFAULT_LINK_ICON,
                          sortOrder: f.state.value.length,
                        },
                      ]);
                    }}
                  >
                    Add Link
                  </Button>
                </div>
              );
            }}
          </form.Field>
        </div>

        <form.Subscribe
          selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting || createGroupMutation.isPending || createLinkMutation.isPending}>
              {isSubmitting ? "Creating..." : "Create Group"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
