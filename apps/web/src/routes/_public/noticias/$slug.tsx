import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Markdown } from "@/components/markdown";
import { PostTimeAgo } from "@/components/noticias/post-time-ago";
import { articleJsonLd, breadcrumbJsonLd, buildSeo, truncate, withBrand } from "@/lib/seo";
import { useTRPC } from "@/utils/trpc";

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
      throw notFound();
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
      image: post.imageUrl,
      type: "article",
      publishedTime: post.createdAt,
      modifiedTime: post.createdAt,
      jsonLd: [
        articleJsonLd({
          title: post.title,
          path,
          image: post.imageUrl,
          description,
          datePublished: post.createdAt,
          dateModified: post.createdAt,
        }),
        breadcrumbJsonLd([
          { name: "Início", path: "/" },
          { name: "Notícias", path: "/noticias" },
          { name: post.title, path },
        ]),
      ],
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(trpc.posts.bySlug.queryOptions({ slug }));

  if (!post) return null;

  return (
    <article className="mx-auto max-w-4xl py-10 md:py-16">
      <header className="mx-auto max-w-2xl text-center">
        <h1
          className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          style={{ viewTransitionName: `post-title-${slug}` }}
        >
          {post.title}
        </h1>

        {post.createdAt && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <PostTimeAgo date={post.createdAt} />
          </div>
        )}
      </header>

      {post.imageUrl && (
        <img
          alt={post.title}
          className="mt-8 aspect-video w-full rounded-xl border border-border object-cover"
          decoding="async"
          src={post.imageUrl}
          style={{ viewTransitionName: `post-image-${slug}` }}
        />
      )}

      {post.content && (
        <div className="mx-auto mt-10 max-w-2xl">
          <Markdown content={post.content} />
        </div>
      )}
    </article>
  );
}
