import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";

import { HugeiconsIcon } from "@hugeicons/react";
import { Delete03Icon } from "@hugeicons/core-free-icons";

import { LinkIconSelect } from "@/components/link-icon-select";
import { DEFAULT_LINK_ICON } from "@/lib/link-icons";
import { useTRPC } from "@/utils/trpc";

type GroupLink = {
  id: number;
  label: string;
  href: string | null;
  icon: string;
  sortOrder: number;
};

export const Route = createFileRoute("/_auth/dashboard/links/$id")({
  head: () => ({ meta: [{ title: "Edit Link Group - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.links.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: groups = [] } = useSuspenseQuery(trpc.links.list.queryOptions());
  const group = groups.find((g) => g.id === numId);

  const deleteLinkMutation = useMutation({
    ...trpc.links.deleteLink.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.links.list.queryFilter());
      toast.success("Link deleted");
    },
    onError: () => toast.error("Failed to delete link"),
  });

  const updateGroupMutation = useMutation({
    ...trpc.links.updateGroup.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.links.list.queryFilter());
      toast.success("Group updated");
    },
    onError: () => toast.error("Failed to update group"),
  });

  const groupLabelForm = useForm({
    defaultValues: { label: group?.label ?? "" },
    validators: {
      onSubmit: z.object({ label: z.string().min(1, "Label is required") }),
    },
    onSubmit: ({ value }) => {
      updateGroupMutation.mutate({ id: numId, label: value.label });
    },
  });

  if (!group) {
    return <p>Group not found.</p>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit: {group.label}</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/links" })}>
          Back
        </Button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          groupLabelForm.handleSubmit();
        }}
        className="mb-6 flex items-end gap-2"
      >
        <groupLabelForm.Field name="label">
          {(f) => (
            <div className="flex-1 space-y-1">
              <Label htmlFor={f.name}>Group Label</Label>
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
        </groupLabelForm.Field>
        <groupLabelForm.Subscribe selector={(s) => ({ canSubmit: s.canSubmit })}>
          {({ canSubmit }) => (
            <Button type="submit" size="sm" disabled={!canSubmit}>
              Rename
            </Button>
          )}
        </groupLabelForm.Subscribe>
      </form>

      <div className="mb-6">
        <h2 className="mb-1 font-semibold">Links</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Deixe a URL em branco para sinalizar que ainda não está disponível ("em breve").
        </p>
        <div className="space-y-3">
          {group.links.map((link) => (
            <LinkEditRow
              key={link.id}
              link={link as GroupLink}
              onDelete={(linkId) => deleteLinkMutation.mutate({ id: linkId })}
            />
          ))}
        </div>
      </div>

      <NewLinkForm
        groupId={numId}
        onCreated={() => qc.invalidateQueries(trpc.links.list.queryFilter())}
      />
    </div>
  );
}

function LinkEditRow({ link, onDelete }: { link: GroupLink; onDelete: (id: number) => void }) {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const updateLinkMutation = useMutation({
    ...trpc.links.updateLink.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.links.list.queryFilter());
      toast.success("Link updated");
    },
    onError: () => toast.error("Failed to update link"),
  });

  const form = useForm({
    defaultValues: {
      label: link.label,
      href: link.href ?? "",
      icon: link.icon,
      sortOrder: link.sortOrder,
    },
    validators: {
      onSubmit: z.object({
        label: z.string().min(1, "Label is required"),
        href: z.string(),
        icon: z.string(),
        sortOrder: z.number(),
      }),
    },
    onSubmit: ({ value }) => {
      updateLinkMutation.mutate({
        id: link.id,
        label: value.label,
        href: value.href,
        icon: value.icon,
        sortOrder: value.sortOrder,
      });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
    >
      <form.Field name="label">
        {(f) => (
          <div className="flex min-w-[140px] flex-1 flex-col gap-1">
            <Label htmlFor={f.name} className="text-xs text-muted-foreground">
              Rótulo
            </Label>
            <Input
              id={f.name}
              placeholder="Rótulo"
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
      <form.Field name="href">
        {(f) => (
          <div className="flex min-w-[200px] flex-[1.6] flex-col gap-1">
            <Label htmlFor={f.name} className="text-xs text-muted-foreground">
              URL
            </Label>
            <Input
              id={f.name}
              type="url"
              placeholder="URL (opcional)"
              value={f.state.value}
              onBlur={f.handleBlur}
              onChange={(e) => f.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>
      <form.Field name="icon">
        {(f) => (
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Ícone</Label>
            <LinkIconSelect value={f.state.value} onChange={(svg) => f.handleChange(svg)} />
          </div>
        )}
      </form.Field>
      <form.Field name="sortOrder">
        {(f) => (
          <div className="flex w-20 flex-col gap-1">
            <Label htmlFor={f.name} className="text-xs text-muted-foreground">
              Ordem
            </Label>
            <Input
              id={f.name}
              type="number"
              value={String(f.state.value)}
              onBlur={f.handleBlur}
              onChange={(e) => f.handleChange(Number(e.target.value))}
            />
          </div>
        )}
      </form.Field>
      <div className="flex items-center gap-1">
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit })}>
          {({ canSubmit }) => (
            <Button type="submit" variant="outline" size="sm" disabled={!canSubmit}>
              Save
            </Button>
          )}
        </form.Subscribe>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(link.id)}
          aria-label="Excluir link"
        >
          <HugeiconsIcon className="size-4 text-destructive" icon={Delete03Icon} strokeWidth={2} />
        </Button>
      </div>
    </form>
  );
}

function NewLinkForm({ groupId, onCreated }: { groupId: number; onCreated: () => void }) {
  const trpc = useTRPC();

  const createLinkMutation = useMutation({
    ...trpc.links.createLink.mutationOptions(),
    onSuccess: () => {
      onCreated();
      toast.success("Link added");
    },
    onError: () => toast.error("Failed to add link"),
  });

  const form = useForm({
    defaultValues: { label: "", href: "", icon: DEFAULT_LINK_ICON, sortOrder: 0 },
    validators: {
      onSubmit: z.object({
        label: z.string().min(1, "Label is required"),
        href: z.string(),
        icon: z.string(),
        sortOrder: z.number(),
      }),
    },
    onSubmit: ({ value }) => {
      createLinkMutation.mutate({
        label: value.label,
        href: value.href,
        icon: value.icon,
        sortOrder: value.sortOrder,
        linkGroupId: groupId,
      });
    },
  });

  return (
    <div>
      <h3 className="mb-2 font-medium text-sm">Add New Link</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <form.Field name="label">
          {(f) => (
            <div className="flex min-w-[140px] flex-1 flex-col gap-1">
              <Label htmlFor={f.name} className="text-xs text-muted-foreground">
                Rótulo
              </Label>
              <Input
                id={f.name}
                placeholder="Rótulo"
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
        <form.Field name="href">
          {(f) => (
            <div className="flex min-w-[200px] flex-[1.6] flex-col gap-1">
              <Label htmlFor={f.name} className="text-xs text-muted-foreground">
                URL
              </Label>
              <Input
                id={f.name}
                type="url"
                placeholder="URL (opcional)"
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="icon">
          {(f) => (
            <div className="flex flex-col gap-1">
              <Label className="text-xs text-muted-foreground">Ícone</Label>
              <LinkIconSelect value={f.state.value} onChange={(svg) => f.handleChange(svg)} />
            </div>
          )}
        </form.Field>
        <form.Field name="sortOrder">
          {(f) => (
            <div className="flex w-20 flex-col gap-1">
              <Label htmlFor={f.name} className="text-xs text-muted-foreground">
                Ordem
              </Label>
              <Input
                id={f.name}
                type="number"
                value={String(f.state.value)}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(Number(e.target.value))}
              />
            </div>
          )}
        </form.Field>
        <form.Subscribe
          selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" size="sm" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "..." : "Add"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
