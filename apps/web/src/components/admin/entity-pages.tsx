import { useState } from "react";
import { type LinkProps } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@fsx/ui/components/button";

import { EmptyCollection } from "@/components/admin/empty-collection";
import { EntityForm, EntityFormDialog, type EntityField, type EntitySection, type ImageTracking } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { impactTarget } from "@/components/admin/delete-dialog";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { RowLink } from "@/components/data-table/row-link";

type Values = Record<string, string>;

interface EntityPageBase {
  /** Singular, lowercase: "club". */
  noun: string;
  /** Collection route, e.g. "/dashboard/clubs". */
  basePath: string;
  backLabel: string;
}

const asRoute = (path: string) => path as LinkProps["to"];

export function EntityEditPage({
  id,
  noun,
  basePath,
  backLabel,
  description,
  name,
  sections,
  defaultValues,
  onSubmit,
  error,
  pending,
  onDelete,
  deleting,
  images,
}: EntityPageBase & {
  id: number;
  description: string;
  /** Record name, shown as the page title and in the delete confirmation. */
  name: string;
  sections: EntitySection[];
  defaultValues: Values;
  onSubmit: (values: Values) => void;
  error: unknown;
  pending: boolean;
  onDelete: () => void;
  deleting: boolean;
  images?: ImageTracking;
}) {
  return (
    <>
      <AdminPageHeader
        backTo={asRoute(basePath)}
        backLabel={backLabel}
        title={name}
        description={description}
        actions={
          <ConfirmDeleteButton
            label={`Delete ${noun}`}
            title={`Delete this ${noun}?`}
            itemName={name}
            target={impactTarget(noun, id)}
            pending={deleting}
            onConfirm={onDelete}
          />
        }
      />
      <EntityForm
        sections={sections}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        error={error}
        pending={pending}
        submitLabel="Save changes"
        cancelTo={asRoute(basePath)}
        images={images}
      />
    </>
  );
}

export function EntityListPage<Row extends { id: number; name: string }>({
  noun,
  basePath,
  title,
  description,
  plural,
  rows,
  columns = [],
  showId = true,
  onDelete,
  deleting,
  create,
}: Omit<EntityPageBase, "backLabel"> & {
  title: string;
  description: string;
  /** Lowercase plural for the empty state and the search placeholder. */
  plural: string;
  rows: Row[];
  /** Columns between Name and the row actions. */
  columns?: ColumnDef<Row>[];
  showId?: boolean;
  onDelete: (id: number) => void;
  deleting: boolean;
  /** The "New" form, shown in a dialog over the list. `onSubmit` closes it from the mutation's success. */
  create: {
    description: string;
    sections: EntitySection[];
    defaultValues: Values;
    onSubmit: (values: Values, close: () => void) => void;
    error: unknown;
    pending: boolean;
    images?: ImageTracking;
  };
}) {
  const [creating, setCreating] = useState(false);
  const allColumns: ColumnDef<Row>[] = [
    ...(showId
      ? [
          {
            accessorKey: "id",
            header: ({ column }) => <DataTableColumnHeader column={column} title="ID" />,
            cell: ({ row }) => <span className="tabular-nums">{row.original.id}</span>,
          } satisfies ColumnDef<Row>,
        ]
      : []),
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <RowLink to={`${basePath}/$id`} id={row.original.id}>
          {row.original.name}
        </RowLink>
      ),
    },
    ...columns,
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          editTo={`${basePath}/$id`}
          noun={noun}
          displayName={row.original.name}
          isDeleting={deleting}
          onDelete={() => onDelete(row.original.id)}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title={title}
        description={description}
        actions={
          <Button size="xl" onClick={() => setCreating(true)}>
            New {noun}
          </Button>
        }
      />
      <EntityFormDialog
        open={creating}
        onOpenChange={setCreating}
        title={`New ${noun}`}
        description={create.description}
        fields={create.sections.flatMap((section) => section.fields) as EntityField[]}
        defaultValues={create.defaultValues}
        onSubmit={(values) => create.onSubmit(values, () => setCreating(false))}
        error={create.error}
        pending={create.pending}
        submitLabel={`Create ${noun}`}
        images={create.images}
      />
      <DataTable
        emptyState={<EmptyCollection noun={plural} onCreate={() => setCreating(true)} />}
        columns={allColumns}
        data={rows}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            searchKey="name"
            searchPlaceholder={`Search ${noun}...`}
          />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />
    </div>
  );
}
