import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { InlineAlert } from "@/components/admin/inline-alert";
import { AdminPageHeader } from "@/components/admin/page-header";
import { PostArticle } from "@/components/noticias/post-article";
import { orNotFound } from "@/lib/errors";
import { formatSchedule } from "@/lib/schedule";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_auth/dashboard/post-preview/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Preview post - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    orNotFound(context.queryClient.ensureQueryData(context.trpc.posts.forEdit.queryOptions({ id: params.id }))),
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const { data: post } = useSuspenseQuery(trpc.posts.forEdit.queryOptions({ id }));
  const scheduled = post.published && post.publishAt;

  return (
    <>
      <AdminPageHeader backTo="/dashboard/posts" backLabel="Posts" title="Preview" description="The article as readers will see it." />
      <InlineAlert tone="warning" title={scheduled ? "Scheduled" : post.published ? "Published" : "Draft"}>
        {scheduled
          ? `Goes live on ${formatSchedule(post.publishAt!)}. Until then it is hidden from the site, the news feed, and the sitemap.`
          : post.published
            ? "This article is live."
            : "Only visible in the dashboard until you publish it."}
      </InlineAlert>
      <PostArticle post={post} />
    </>
  );
}
