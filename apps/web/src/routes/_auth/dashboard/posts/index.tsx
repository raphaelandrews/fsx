import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@fsx/ui/components/badge";
import { Button } from "@fsx/ui/components/button";

import { useTRPC } from "@/utils/trpc";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { RowLink } from "@/components/data-table/row-link";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { useAdminMutation } from "@/lib/admin-mutations";
import { EmptyCollection } from "@/components/admin/empty-collection";

export const Route = createFileRoute("/_auth/dashboard/posts/")({
  head: () => ({ meta: [{ title: "Posts - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.posts.listAdmin.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();

  const { data = [] } = useSuspenseQuery(trpc.posts.listAdmin.queryOptions());

  const deleteMutation = useAdminMutation(trpc.posts.delete.mutationOptions(), {
    invalidates: "posts",
    success: "Post deleted",
    failure: "Failed to delete post",
  });

  const columns: ColumnDef<(typeof data)[number]>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => <RowLink to="/dashboard/posts/$id" id={row.original.id}>{row.getValue("title")}</RowLink>,
    },
    {
      accessorKey: "slug",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
      cell: ({ row }) => <span className="text-muted-foreground">{row.getValue("slug")}</span>,
    },
    {
      accessorKey: "published",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Published" />,
      cell: ({ row }) => (
        <Badge variant={row.original.published ? "default" : "outline"}>
          {row.original.published ? "Yes" : "No"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          isDeleting={deleteMutation.isPending}
          editTo="/dashboard/posts/$id"
          noun="post"
          onDelete={() => deleteMutation.mutate({ id: row.original.id })}
          displayName={row.original.title}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Posts"
        description="Manage site posts."
        actions={
          <Link to="/dashboard/posts/create">
            <Button>New post</Button>
          </Link>
        }
      />
      <DataTable
        emptyState={<EmptyCollection noun="posts" createTo="/dashboard/posts/create" />}
        columns={columns}
        data={data}
        toolbar={(table) => (
          <DataTableToolbar table={table} searchKey="title" searchPlaceholder="Search post..." />
        )}
        pagination={(table) => <DataTablePagination table={table} />}
      />
    </div>
  );
}
