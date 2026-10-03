import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/page-header";
import { PostForm } from "@/components/admin/post-form";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";
import { useAdminMutation, useInvalidateAdmin } from "@/lib/admin-mutations";
import { orNotFound, showMutationError } from "@/lib/errors";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";
import { slugify } from "@/utils/slugify";

export const Route = createFileRoute("/_auth/dashboard/posts/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Edit post - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    orNotFound(
      context.queryClient.ensureQueryData(
        context.trpc.posts.forEdit.queryOptions({ id: params.id }),
      ),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();
  const invalidateAdmin = useInvalidateAdmin();
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
      showMutationError(error, "Failed to update post", () => window.location.reload());
    },
  });
  const deleteMutation = useAdminMutation(trpc.posts.delete.mutationOptions(), {
    invalidates: "posts",
    success: "Post deleted",
    failure: "Failed to delete post",
    onSuccess: () => navigate({ to: "/dashboard/posts" }),
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/posts"
        backLabel="Posts"
        title={post.title}
        description={
          post.published ? "Published article." : "Draft: only visible in the dashboard."
        }
        actions={
          <ConfirmDeleteButton
            label="Delete post"
            title="Delete this post?"
            itemName={post.title}
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id })}
          />
        }
      />
      <PostForm
        defaultValues={{
          title: post.title,
          slug: slugify(post.title),
          imageUrl: post.imageUrl ?? "",
          content: post.content,
          published: post.published,
        }}
        onSubmit={(values) =>
          updateMutation.mutate({ id, ...values, imageUrl: values.imageUrl || null })
        }
        error={updateMutation.error}
        pending={updateMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/posts"
        onImageReplaced={trackReplaced}
        onImageUploaded={trackCreated}
      />
    </>
  );
}
