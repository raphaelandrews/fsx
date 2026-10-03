import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminPageHeader } from "@/components/admin/page-header";
import { PostForm } from "@/components/admin/post-form";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";
import { useInvalidateAdmin } from "@/lib/admin-mutations";
import { showMutationError } from "@/lib/errors";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/posts/create")({
  head: () => ({ meta: [{ title: "New post - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const invalidateAdmin = useInvalidateAdmin();
  const { trackReplaced, trackCreated, commit, discard } = usePendingImageDeletes();

  const createMutation = useMutation({
    ...trpc.posts.create.mutationOptions(),
    onSuccess: async () => {
      await invalidateAdmin("posts");
      await commit();
      toast.success("Post created");
      await navigate({ to: "/dashboard/posts" });
    },
    onError: (error, variables) => {
      void discard(variables.imageUrl);
      showMutationError(error, "Failed to create post");
    },
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
        defaultValues={{ title: "", slug: "", imageUrl: "", content: "", published: false }}
        onSubmit={(values) =>
          createMutation.mutate({ ...values, imageUrl: values.imageUrl || null })
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
