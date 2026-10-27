import { Markdown } from "@/components/markdown/markdown";
import { PostTimeAgo } from "@/components/noticias/post-time-ago";
import { coverImage } from "@/lib/media-image";

export function PostArticle({
  post,
}: {
  post: { slug: string; title: string; createdAt: string | null; imageUrl: string | null; content: string };
}) {
  const { slug } = post;
  return (
    <article className="mx-auto max-w-4xl pt-10 md:pt-16">
      <header className="mx-auto max-w-2xl text-center">
        <h1
          className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl"
          style={{ viewTransitionName: `post-title-${slug}` }}
        >
          {post.title}
        </h1>

        {post.createdAt && (
          <div className="mt-4 flex items-center justify-center gap-2 text-base text-muted-foreground">
            <PostTimeAgo date={post.createdAt} />
          </div>
        )}
      </header>

      {post.imageUrl && (
        <img
          alt={post.title}
          className="mt-8 aspect-video w-full rounded-xl object-cover"
          decoding="async"
          fetchPriority="high"
          height={675}
          {...coverImage(post.imageUrl, "(min-width: 768px) 720px, 100vw")}
          style={{ viewTransitionName: `post-image-${slug}` }}
          width={1200}
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
