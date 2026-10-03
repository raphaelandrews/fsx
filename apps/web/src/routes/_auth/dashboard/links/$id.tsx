import { useState } from "react";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { DEFAULT_LINK_ICON, resolveLinkIcon } from "@fsx/api/link-icons";
import { Button } from "@fsx/ui/components/button";

import { EntityForm, EntityFormDialog, type EntityField } from "@/components/admin/entity-form";
import { AdminSection } from "@/components/admin/form-layout";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { LinkIconSelect } from "@/components/link-icon-select";
import { useAdminMutation } from "@/lib/admin-mutations";
import { LINK_GROUP_SECTIONS } from "@/lib/admin-forms";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/links/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit link group - Admin - FSX" }] }),
  loader: async ({ context, params }) => {
    const groups = await context.queryClient.ensureQueryData(
      context.trpc.links.list.queryOptions(),
    );
    if (!groups.some((group) => group.id === params.id)) throw notFound();
  },
  component: RouteComponent,
});

const LINK_FIELDS: EntityField[] = [
  { name: "label", label: "Label", kind: "text", required: true },
  {
    name: "href",
    label: "URL",
    kind: "url",
    hint: "Leave empty to show the link as “coming soon”.",
  },
  {
    name: "icon",
    label: "Icon",
    kind: "custom",
    render: ({ value, onChange }) => <LinkIconSelect value={value} onChange={onChange} />,
  },
  {
    name: "sortOrder",
    label: "Order",
    kind: "number",
    required: true,
    min: 0,
    hint: "Lower numbers come first.",
  },
];

type EditingLink = {
  id?: number;
  label: string;
  href: string;
  icon: string;
  sortOrder: number;
} | null;

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();

  const { data: groups } = useSuspenseQuery(trpc.links.list.queryOptions());
  const group = groups.find((candidate) => candidate.id === id);
  const [editing, setEditing] = useState<EditingLink>(null);

  const updateGroupMutation = useAdminMutation(trpc.links.updateGroup.mutationOptions(), {
    invalidates: "links",
    success: "Group updated",
    failure: "Failed to update group",
    reloadOnConflict: true,
  });
  const deleteGroupMutation = useAdminMutation(trpc.links.deleteGroup.mutationOptions(), {
    invalidates: "links",
    success: "Group deleted",
    failure: "Failed to delete group",
    onSuccess: () => navigate({ to: "/dashboard/links" }),
  });
  const createLinkMutation = useAdminMutation(trpc.links.createLink.mutationOptions(), {
    invalidates: "links",
    success: "Link added",
    failure: "Failed to add link",
    onSuccess: () => setEditing(null),
  });
  const updateLinkMutation = useAdminMutation(trpc.links.updateLink.mutationOptions(), {
    invalidates: "links",
    success: "Link updated",
    failure: "Failed to update link",
    reloadOnConflict: true,
    onSuccess: () => setEditing(null),
  });
  const deleteLinkMutation = useAdminMutation(trpc.links.deleteLink.mutationOptions(), {
    invalidates: "links",
    success: "Link deleted",
    failure: "Failed to delete link",
  });

  if (!group) return null;
  const links = [...group.links].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const nextOrder = links.reduce((max, link) => Math.max(max, link.sortOrder), -1) + 1;
  const linkMutation = editing?.id ? updateLinkMutation : createLinkMutation;

  const columns: ColumnDef<(typeof links)[number]>[] = [
    {
      accessorKey: "sortOrder",
      header: "Order",
      cell: ({ row }) => <span className="tabular-nums">{row.original.sortOrder}</span>,
    },
    {
      accessorKey: "label",
      header: "Label",
      cell: ({ row }) => (
        <span className="flex items-center gap-2 font-medium">
          <span
            aria-hidden
            className="size-4 shrink-0 [&_svg]:size-4"
            dangerouslySetInnerHTML={{ __html: resolveLinkIcon(row.original.icon) }}
          />
          {row.original.label}
        </span>
      ),
    },
    {
      accessorKey: "href",
      header: "URL",
      cell: ({ row }) =>
        row.original.href ? (
          <span className="line-clamp-1 break-all text-muted-foreground">{row.original.href}</span>
        ) : (
          <span className="text-muted-foreground">Coming soon</span>
        ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          noun="link"
          displayName={row.original.label}
          onEdit={() =>
            setEditing({
              id: row.original.id,
              label: row.original.label,
              href: row.original.href ?? "",
              icon: resolveLinkIcon(row.original.icon),
              sortOrder: row.original.sortOrder,
            })
          }
          isDeleting={deleteLinkMutation.isPending}
          onDelete={() => deleteLinkMutation.mutate({ id: row.original.id })}
        />
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/links"
        backLabel="Links"
        title={group.label}
        description="Edit the group and its links."
        actions={
          <ConfirmDeleteButton
            label="Delete group"
            title="Delete this link group?"
            itemName={group.label}
            description={`“${group.label}” and its ${links.length} link(s) will be permanently deleted. This cannot be undone.`}
            pending={deleteGroupMutation.isPending}
            onConfirm={() => deleteGroupMutation.mutate({ id })}
          />
        }
      />
      <EntityForm
        sections={LINK_GROUP_SECTIONS}
        defaultValues={{ label: group.label }}
        onSubmit={(values) => updateGroupMutation.mutate({ id, label: values.label! })}
        error={updateGroupMutation.error}
        pending={updateGroupMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/links"
      />

      <AdminSection
        title="Links"
        description="Shown in this order on the public /links page."
        actions={
          <Button
            onClick={() =>
              setEditing({ label: "", href: "", icon: DEFAULT_LINK_ICON, sortOrder: nextOrder })
            }
          >
            Add link
          </Button>
        }
      >
        <DataTable
          columns={columns}
          data={links}
          emptyState="No links in this group yet."
          pagination={(table) => <DataTablePagination table={table} />}
        />
      </AdminSection>

      <EntityFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing?.id ? "Edit link" : "Add link"}
        fields={LINK_FIELDS}
        defaultValues={{
          label: editing?.label ?? "",
          href: editing?.href ?? "",
          icon: editing?.icon ?? DEFAULT_LINK_ICON,
          sortOrder: String(editing?.sortOrder ?? nextOrder),
        }}
        onSubmit={(values) => {
          const payload = {
            label: values.label!,
            href: values.href!,
            icon: values.icon!,
            sortOrder: Number(values.sortOrder),
          };
          if (editing?.id) updateLinkMutation.mutate({ id: editing.id, ...payload });
          else createLinkMutation.mutate({ ...payload, linkGroupId: id });
        }}
        error={linkMutation.error}
        pending={linkMutation.isPending}
        submitLabel={editing?.id ? "Save link" : "Add link"}
      />
    </>
  );
}
