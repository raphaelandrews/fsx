import { Link, notFound, type LinkProps } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@fsx/ui/components/button";

import { EmptyCollection } from "@/components/admin/empty-collection";
import { EntityForm, type EntitySection, type ImageTracking } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { RowLink } from "@/components/data-table/row-link";

type Values = Record<string, string>;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Toast copy shared by the create, update and delete mutations of one entity. */
export function entityMessages(noun: string) {
  return {
    create: { success: `${capitalize(noun)} created`, failure: `Failed to create ${noun}` },
    update: { success: `${capitalize(noun)} updated`, failure: `Failed to update ${noun}` },
    delete: { success: `${capitalize(noun)} deleted`, failure: `Failed to delete ${noun}` },
  };
}

/** Route loader step: 404 unless the id is in a collection that edit pages read from. */
export async function ensureListRecord<T extends { id: number }>(
  records: Promise<T[]>,
  id: number,
) {
  if (!(await records).some((record) => record.id === id)) throw notFound();
}

interface EntityPageBase {
  /** Singular, lowercase: "club". */
  noun: string;
  /** Collection route, e.g. "/dashboard/clubs". */
  basePath: string;
  backLabel: string;
}

const asRoute = (path: string) => path as LinkProps["to"];

export function EntityCreatePage({
  noun,
  basePath,
  backLabel,
  description,
  sections,
  defaultValues,
  onSubmit,
  error,
  pending,
  images,
}: EntityPageBase & {
  description: string;
  sections: EntitySection[];
  defaultValues: Values;
  onSubmit: (values: Values) => void;
  error: unknown;
  pending: boolean;
  images?: ImageTracking;
}) {
  return (
    <>
      <AdminPageHeader
        backTo={asRoute(basePath)}
        backLabel={backLabel}
        title={`New ${noun}`}
        description={description}
      />
      <EntityForm
        sections={sections}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        error={error}
        pending={pending}
        submitLabel={`Create ${noun}`}
        cancelTo={asRoute(basePath)}
        images={images}
      />
    </>
  );
}

export function EntityEditPage({
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
}) {
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
          <Link to={asRoute(`${basePath}/create`)}>
            <Button>New {noun}</Button>
          </Link>
        }
      />
      <DataTable
        emptyState={<EmptyCollection noun={plural} createTo={asRoute(`${basePath}/create`)} />}
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
