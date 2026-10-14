import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { PostArticle } from "@/components/noticias/post-article";
import { articleJsonLd, breadcrumbJsonLd, buildSeo, truncate, withBrand } from "@/lib/seo";
import { getErrorCode } from "@/lib/errors";
import { ogImagePath } from "@/lib/og";
import { useTRPC } from "@/lib/trpc";
import { ArticleSkeleton } from "@/components/skeletons/article-skeleton";

export const Route = createFileRoute("/_public/noticias/$slug")({
  loader: async ({ context, params }) => {
    try {
      const post = await context.queryClient.ensureQueryData(
        context.trpc.posts.bySlug.queryOptions({ slug: params.slug }),
      );
      if (!post) throw notFound();
      return post;
    } catch (error) {
      if (error instanceof Response) throw error;
      if (getErrorCode(error) === "NOT_FOUND") throw notFound();
      throw error;
    }
  },
  head: ({ loaderData }) => {
    const post = loaderData;
    if (!post) {
      return buildSeo({
        title: withBrand("Notícia"),
        description: "Notícia da Federação Sergipana de Xadrez.",
        path: "/noticias",
        noindex: true,
      });
    }
    const path = `/noticias/${post.slug}`;
    const description = truncate(post.content);
    return buildSeo({
      title: withBrand(post.title),
      description,
      path,
      image: post.imageUrl ?? ogImagePath("post", post.slug, { title: post.title }),
      type: "article",
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt ?? post.createdAt,
      jsonLd: [
        articleJsonLd({
          title: post.title,
          path,
          image: post.imageUrl,
          description,
          datePublished: post.createdAt,
          dateModified: post.updatedAt ?? post.createdAt,
        }),
        breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Notícias", path: "/noticias" },
          { name: post.title, path },
        ]),
      ],
    });
  },
  pendingComponent: () => <ArticleSkeleton />,
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(trpc.posts.bySlug.queryOptions({ slug }));

  if (!post) return null;

  return <PostArticle post={post} />;
}
