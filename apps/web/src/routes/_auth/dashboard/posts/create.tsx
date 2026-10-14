import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AdminPageHeader } from "@/components/admin/page-header";
import { PostForm } from "@/components/admin/post-form";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";
import { useAdminMutation } from "@/lib/admin-mutations";
import { scheduleToInstant } from "@/lib/schedule";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_auth/dashboard/posts/create")({
  head: () => ({ meta: [{ title: "New post - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { trackReplaced, trackCreated, commit, discard } = usePendingImageDeletes();

  const createMutation = useAdminMutation(trpc.posts.create.mutationOptions(), {
    invalidates: "posts",
    awaitInvalidation: true,
    success: "Post created",
    failure: "Failed to create post",
    onSuccess: async () => {
      await commit();
      await navigate({ to: "/dashboard/posts" });
    },
    onError: (_error, variables) => discard(variables.imageUrl),
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/posts"
        backLabel="Posts"
        title="New post"
        description="Write a news article."
      />
      <PostForm
        defaultValues={{ title: "", slug: "", imageUrl: "", content: "", published: false, publishAt: "" }}
        onSubmit={(values) =>
          createMutation.mutate({ ...values, imageUrl: values.imageUrl || null, publishAt: scheduleToInstant(values.publishAt) })
        }
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create post"
        cancelTo="/dashboard/posts"
        onImageReplaced={trackReplaced}
        onImageUploaded={trackCreated}
      />
    </>
  );
}
