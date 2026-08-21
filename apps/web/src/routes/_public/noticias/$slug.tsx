import { createFileRoute, notFound } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"

import { Announcement } from "@/components/announcement"
import { MDX } from "@/components/mdx"
import { PostTimeAgo } from "@/components/noticias/post-time-ago"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/_public/noticias/$slug")({
  head: () => ({
    meta: [
      { title: "Notícia - FSX" },
      { name: "description", content: "Notícia da Federação Sergipana de Xadrez" },
    ],
  }),
  loader: async ({ context, params }) => {
    try {
      const post = await context.queryClient.ensureQueryData(
        context.trpc.posts.bySlug.queryOptions({ slug: params.slug })
      )
      if (!post) throw notFound()
      return post
    } catch (error) {
      if (error instanceof Response) throw error
      throw notFound()
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const trpc = useTRPC()
  const { slug } = Route.useParams()
  const { data: post } = useSuspenseQuery(trpc.posts.bySlug.queryOptions({ slug }))

  if (!post) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <Announcement label="Notícia" />

      <section className="mb-0">
        <div className="p-4">
          <h1 className="text-balance text-xl font-semibold tracking-tighter text-primary">
            {post.title}
          </h1>

          {post.createdAt && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <PostTimeAgo date={post.createdAt} />
            </div>
          )}
        </div>
      </section>

      {post.imageUrl && (
        <>
          <section className="mb-0 p-4">
            <div className="rounded-[10px] border border-border p-[4px]">
              <img
                alt={post.title}
                className="max-h-[400px] w-full rounded-lg object-cover"
                decoding="async"
                loading="lazy"
                src={post.imageUrl}
              />
            </div>
          </section>
        </>
      )}

      {post.content && (
        <section className="mb-0 p-4">
          <MDX content={post.content} />
        </section>
      )}
    </div>
  )
}
