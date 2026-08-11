import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/posts/")({
  head: () => ({ title: "Posts - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const { data: posts = [] } = useSuspenseQuery(trpc.posts.listAdmin.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.posts.delete.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.posts.listAdmin.queryFilter());
      toast.success("Post deleted");
    },
    onError: () => toast.error("Failed to delete post"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Posts</h1>
        <Link to="/dashboard/posts/create">
          <Button>Create Post</Button>
        </Link>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Slug</th>
              <th className="px-4 py-2 text-left">Published</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2">{p.title}</td>
                <td className="px-4 py-2 text-muted-foreground">{p.slug}</td>
                <td className="px-4 py-2">{p.published ? "Yes" : "No"}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex gap-1 justify-end">
                    <Link to="/dashboard/posts/$id" params={{ id: p.id }}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate({ id: p.id })}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
