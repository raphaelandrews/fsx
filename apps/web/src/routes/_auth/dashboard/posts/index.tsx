import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { Badge } from "@fsx/ui/components/badge";
import { Button } from "@fsx/ui/components/button";

import { useTRPC } from "@/utils/trpc";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";

export const Route = createFileRoute("/_auth/dashboard/posts/")({
  head: () => ({ meta: [{ title: "Posts - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.posts.listAdmin.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const { data = [] } = useSuspenseQuery(trpc.posts.listAdmin.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.posts.delete.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.posts.listAdmin.queryFilter());
      toast.success("Post deleted");
    },
    onError: () => toast.error("Failed to delete post"),
  });

  const columns: ColumnDef<(typeof data)[number]>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
      cell: ({ row }) => <span className="font-medium">{row.getValue("title")}</span>,
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
          editTo="/dashboard/posts/$id"
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
