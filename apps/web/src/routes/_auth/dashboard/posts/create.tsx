import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { Textarea } from "@fsx/ui/components/textarea";
import { toast } from "sonner";
import z from "zod";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/posts/create")({
  head: () => ({ meta: [{ title: "Create Post - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const createMutation = useMutation({
    ...trpc.posts.create.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.posts.listAdmin.queryFilter());
      qc.invalidateQueries(trpc.posts.list.queryFilter());
      qc.invalidateQueries(trpc.posts.fresh.queryFilter());
      qc.invalidateQueries(trpc.posts.byPage.queryFilter());
      toast.success("Post created");
      navigate({ to: "/dashboard/posts" });
    },
    onError: (error) => toast.error(error.message ?? "Failed to create post"),
  });

  const form = useForm({
    defaultValues: { title: "", slug: "", imageUrl: "", content: "", published: false },
    onSubmit: ({ value }) => {
      createMutation.mutate({ title: value.title, slug: value.slug, imageUrl: value.imageUrl || null, content: value.content, published: value.published });
    },
    validators: {
      onSubmit: z.object({
        title: z.string().min(1, "Title is required"),
        slug: z.string().min(1, "Slug is required"),
        imageUrl: z.string(),
        content: z.string().min(1, "Content is required"),
        published: z.boolean(),
      }),
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Post</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="title">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Title</Label>
              <Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />
              {f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}
            </div>
          )}
        </form.Field>
        <form.Field name="slug">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Slug</Label>
              <Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />
              {f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}
            </div>
          )}
        </form.Field>
        <form.Field name="imageUrl">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Image URL</Label>
              <Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />
            </div>
          )}
        </form.Field>
        <form.Field name="content">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Content</Label>
              <Textarea id={f.name} rows={8} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />
              {f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}
            </div>
          )}
        </form.Field>
        <form.Field name="published">
          {(f) => (
            <div className="flex items-center gap-2">
              <input id={f.name} type="checkbox" checked={f.state.value} onChange={(e) => f.handleChange(e.target.checked)} className="h-4 w-4 rounded border-input" />
              <Label htmlFor={f.name}>Published</Label>
            </div>
          )}
        </form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Post"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
