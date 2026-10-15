import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { buttonVariants } from "@fsx/ui/components/button";
import { useSuspenseQuery } from "@tanstack/react-query";

import { AdminPageHeader } from "@/components/admin/page-header";
import { PostForm } from "@/components/admin/post-form";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { orNotFound } from "@/lib/errors";
import { idParams } from "@/lib/route-params";
import { isScheduledInFuture, scheduleToInput } from "@/lib/schedule";
import { scheduleToInstant } from "@/lib/schedule";
import { useTRPC } from "@/lib/trpc";

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
  const { trackReplaced, trackCreated, commit, discard } = usePendingImageDeletes();

  const { data: post } = useSuspenseQuery(trpc.posts.forEdit.queryOptions({ id }));

  const updateMutation = useAdminMutation(trpc.posts.update.mutationOptions(), {
    invalidates: "posts",
    success: "Post updated",
    failure: "Failed to update post",
    reloadOnConflict: true,
    onSuccess: () => commit(),
    onError: (_error, variables) => discard(variables.imageUrl),
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
          post.published
            ? isScheduledInFuture(post.publishAt)
              ? "Scheduled: hidden from the site until its publish time."
              : "Published article."
            : "Draft: only visible in the dashboard."
        }
        actions={
          <>
            <Link to="/dashboard/post-preview/$id" params={{ id }} className={buttonVariants({ variant: "outline" })}>
              Preview
            </Link>
            <ConfirmDeleteButton
            label="Delete post"
            title="Delete this post?"
            itemName={post.title}
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id })}
          />
          </>
        }
      />
      <PostForm
        defaultValues={{
          title: post.title,
          slug: post.slug,
          imageUrl: post.imageUrl ?? "",
          content: post.content,
          published: post.published,
          publishAt: scheduleToInput(post.publishAt),
        }}
        onSubmit={(values) =>
          updateMutation.mutate({ id, ...values, imageUrl: values.imageUrl || null, publishAt: values.published ? scheduleToInstant(values.publishAt) : null })
        }
        error={updateMutation.error}
        pending={updateMutation.isPending}
        submitLabel="Save changes"
        cancelTo="/dashboard/posts"
        lockSlug
        onImageReplaced={trackReplaced}
        onImageUploaded={trackCreated}
      />
    </>
  );
}
