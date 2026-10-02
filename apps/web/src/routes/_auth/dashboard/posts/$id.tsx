import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";
import z from "zod";

import { ImageUpload } from "@/components/image-upload";
import { MarkdownEditor } from "@/components/markdown-editor";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";
import { useTRPC } from "@/utils/trpc";
import { getFieldError, orNotFound, showMutationError } from "@/lib/errors";
import { sanitizeTitle, slugify } from "@/utils/slugify";
import { useInvalidateAdmin } from "@/lib/admin-mutations";
import { idParams } from "@/lib/route-params";

export const Route = createFileRoute("/_auth/dashboard/posts/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit Post - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    orNotFound(context.queryClient.ensureQueryData(context.trpc.posts.forEdit.queryOptions({ id: params.id }))),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const invalidateAdmin = useInvalidateAdmin();
  const navigate = useNavigate();
  const { trackReplaced, trackCreated, commit, discard } = usePendingImageDeletes();

  const { data: post } = useSuspenseQuery(trpc.posts.forEdit.queryOptions({ id }));

  const updateMutation = useMutation({
    ...trpc.posts.update.mutationOptions(),
    onSuccess: async () => {
      void invalidateAdmin("posts");
      await commit();
      toast.success("Post updated");
    },
    onError: (error, variables) => {
      void discard(variables.imageUrl);
      showMutationError(error, "Não foi possível atualizar a notícia.", () => window.location.reload());
    },
  });

  if (!post) {
    return (
      <div>
        <h1 className="mb-4 font-bold text-2xl">Edit Post</h1>
        <p className="text-muted-foreground">Post not found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate({ to: "/dashboard/posts" })}
        >
          Back
        </Button>
      </div>
    );
  }

  const form = useForm({
    defaultValues: {
      title: post.title,
      slug: slugify(post.title),
      imageUrl: post.imageUrl ?? "",
      content: post.content,
      published: post.published,
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({
        id: post.id,
        title: value.title,
        slug: value.slug,
        imageUrl: value.imageUrl || null,
        content: value.content,
        published: value.published,
      });
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
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Post</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/posts" })}>
          Back
        </Button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="title">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Title</Label>
              <Input
                id={f.name}
                value={f.state.value}
                aria-invalid={Boolean(f.state.meta.errors.length || getFieldError(updateMutation.error, "title"))}
                aria-describedby={getFieldError(updateMutation.error, "title") ? `${f.name}-server-error` : undefined}
                onBlur={f.handleBlur}
                onChange={(e) => {
                  const value = sanitizeTitle(e.target.value);
                  f.handleChange(value);
                  form.setFieldValue("slug", slugify(value));
                }}
              />
              {f.state.meta.errors.map((e) => (
                <p key={e?.message} className="text-destructive text-xs">
                  {e?.message}
                </p>
              ))}
              {getFieldError(updateMutation.error, "title") && (
                <p id={`${f.name}-server-error`} role="alert" className="text-destructive text-xs">
                  {getFieldError(updateMutation.error, "title")}
                </p>
              )}
            </div>
          )}
        </form.Field>
        <form.Field name="slug">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Slug</Label>
              <Input
                id={f.name}
                value={f.state.value}
                disabled
                aria-invalid={Boolean(getFieldError(updateMutation.error, "slug"))}
                aria-describedby={getFieldError(updateMutation.error, "slug") ? `${f.name}-server-error` : undefined}
              />
              {getFieldError(updateMutation.error, "slug") && (
                <p id={`${f.name}-server-error`} role="alert" className="text-destructive text-xs">
                  {getFieldError(updateMutation.error, "slug")}
                </p>
              )}
            </div>
          )}
        </form.Field>
        <form.Field name="imageUrl">
          {(f) => (
            <div className="space-y-2">
              <Label>Cover image</Label>
              <ImageUpload
                kind="posts"
                value={f.state.value || null}
                onChange={(url) => f.handleChange(url ?? "")}
                onImageReplaced={trackReplaced}
                onUploaded={trackCreated}
                aspectRatio={16 / 9}
                outputWidth={896}
                title="Crop Cover Image"
                description="Adjust the crop area to fit a 16:9 aspect ratio."
              />
              {f.state.meta.errors.map((e) => (
                <p key={e?.message} className="text-destructive text-xs">
                  {e?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>
        <form.Field name="content">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Content</Label>
              {getFieldError(updateMutation.error, "content") && (
                <p id={`${f.name}-server-error`} role="alert" className="text-destructive text-xs">
                  {getFieldError(updateMutation.error, "content")}
                </p>
              )}
              <MarkdownEditor
                id={f.name}
                rows={10}
                aria-invalid={Boolean(f.state.meta.errors.length || getFieldError(updateMutation.error, "content"))}
                aria-describedby={getFieldError(updateMutation.error, "content") ? `${f.name}-server-error` : undefined}
                value={f.state.value}
                onChange={(v) => f.handleChange(v)}
              />
              {f.state.meta.errors.map((e) => (
                <p key={e?.message} className="text-destructive text-xs">
                  {e?.message}
                </p>
              ))}
            </div>
          )}
        </form.Field>
        <form.Field name="published">
          {(f) => (
            <div className="flex items-center gap-2">
              <input
                id={f.name}
                type="checkbox"
                checked={f.state.value}
                onChange={(e) => f.handleChange(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor={f.name}>Published</Label>
            </div>
          )}
        </form.Field>
        <form.Subscribe
          selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting || updateMutation.isPending}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
