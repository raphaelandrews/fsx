import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/links/$id")({
  head: () => ({ title: "Edit Link Group - Admin - FSX" }),
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

  const updateLinkMutation = useMutation({
    ...trpc.links.updateLink.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.links.list.queryFilter());
      toast.success("Link updated");
    },
    onError: () => toast.error("Failed to update link"),
  });

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
    defaultValues: { label: group.label },
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
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/links" })}>Back</Button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); groupLabelForm.handleSubmit(); }} className="mb-6 flex items-end gap-2">
        <groupLabelForm.Field name="label">
          {(f) => (
            <div className="flex-1 space-y-1">
              <Label htmlFor={f.name}>Group Label</Label>
              <Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />
            </div>
          )}
        </groupLabelForm.Field>
        <groupLabelForm.Subscribe selector={(s) => ({ canSubmit: s.canSubmit })}>
          {({ canSubmit }) => <Button type="submit" size="sm" disabled={!canSubmit}>Rename</Button>}
        </groupLabelForm.Subscribe>
      </form>

      <div className="mb-4">
        <h2 className="mb-2 font-semibold">Links</h2>
        {group.links.map((link) => {
          const editForm = useForm({
            defaultValues: { label: link.label, href: link.href, icon: link.icon, order: link.order },
            onSubmit: ({ value }) => {
              updateLinkMutation.mutate({
                id: link.id, label: value.label, href: value.href,
                icon: value.icon, order: value.order,
              });
            },
          });

          return (
            <form key={link.id} onSubmit={(e) => { e.preventDefault(); editForm.handleSubmit(); }} className="mb-2 flex gap-2">
              <editForm.Field name="label">{(f) => <Input placeholder="Label" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="flex-1" />}</editForm.Field>
              <editForm.Field name="href">{(f) => <Input placeholder="URL" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="flex-1" />}</editForm.Field>
              <editForm.Field name="icon">{(f) => <Input placeholder="Icon" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="w-20" />}</editForm.Field>
              <editForm.Field name="order">{(f) => <Input type="number" placeholder="Order" value={String(f.state.value)} onChange={(e) => f.handleChange(Number(e.target.value))} className="w-16" />}</editForm.Field>
              <editForm.Subscribe selector={(s) => ({ canSubmit: s.canSubmit })}>
                {({ canSubmit }) => <Button type="submit" variant="outline" size="sm" disabled={!canSubmit}>Save</Button>}
              </editForm.Subscribe>
              <Button type="button" variant="destructive" size="sm" onClick={() => deleteLinkMutation.mutate({ id: link.id })}>X</Button>
            </form>
          );
        })}
      </div>

      <NewLinkForm groupId={numId} onCreated={() => qc.invalidateQueries(trpc.links.list.queryFilter())} />
    </div>
  );
}

function NewLinkForm({ groupId, onCreated }: { groupId: number; onCreated: () => void }) {
  const trpc = useTRPC();

  const createLinkMutation = useMutation({
    ...trpc.links.createLink.mutationOptions(),
    onSuccess: () => { onCreated(); toast.success("Link added"); },
    onError: () => toast.error("Failed to add link"),
  });

  const form = useForm({
    defaultValues: { label: "", href: "", icon: "", order: 0 },
    onSubmit: ({ value }) => {
      createLinkMutation.mutate({ label: value.label, href: value.href, icon: value.icon, order: value.order, linkGroupId: groupId });
    },
  });

  return (
    <div>
      <h3 className="mb-2 font-medium text-sm">Add New Link</h3>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="flex gap-2">
        <form.Field name="label">{(f) => <Input placeholder="Label" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="flex-1" />}</form.Field>
        <form.Field name="href">{(f) => <Input placeholder="URL" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="flex-1" />}</form.Field>
        <form.Field name="icon">{(f) => <Input placeholder="Icon" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="w-20" />}</form.Field>
        <form.Field name="order">{(f) => <Input type="number" placeholder="Order" value={String(f.state.value)} onChange={(e) => f.handleChange(Number(e.target.value))} className="w-16" />}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => <Button type="submit" size="sm" disabled={!canSubmit || isSubmitting}>{isSubmitting ? "..." : "Add"}</Button>}
        </form.Subscribe>
      </form>
    </div>
  );
}
