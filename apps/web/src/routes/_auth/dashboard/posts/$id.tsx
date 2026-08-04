import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { Textarea } from "@fsx/ui/components/textarea";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/posts/$id")({
  head: () => ({ title: "Edit Post - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: posts = [] } = useSuspenseQuery(trpc.posts.list.queryOptions());
  const post = posts.find((p) => p.id === id);

  const updateMutation = useMutation({
    ...trpc.posts.update.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.posts.list.queryFilter());
      toast.success("Post updated");
    },
    onError: () => toast.error("Failed to update post"),
  });

  if (!post) {
    return (
      <div>
        <h1 className="mb-4 font-bold text-2xl">Edit Post</h1>
        <p className="text-muted-foreground">Post not found in published list.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/dashboard/posts" })}>Back</Button>
      </div>
    );
  }

  const form = useForm({
    defaultValues: { title: post.title, slug: post.slug, image: post.image ?? "", content: "", published: true as boolean },
    onSubmit: ({ value }) => {
      updateMutation.mutate({
        id: post.id, title: value.title, slug: value.slug,
        image: value.image || undefined, content: value.content, published: value.published,
      });
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Post</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/posts" })}>Back</Button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="title">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Title</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="slug">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Slug</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="image">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Image URL</Label><Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="content">{(f) => (<div className="space-y-2"><Label htmlFor={f.name}>Content</Label><Textarea id={f.name} rows={10} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} /></div>)}</form.Field>
        <form.Field name="published">{(f) => (<div className="flex items-center gap-2"><input id={f.name} type="checkbox" checked={f.state.value} onChange={(e) => f.handleChange(e.target.checked)} className="h-4 w-4 rounded border-input" /><Label htmlFor={f.name}>Published</Label></div>)}</form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
