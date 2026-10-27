import type { inferRouterOutputs } from "@trpc/server"

import type { AppRouter } from "@fsx/api/routers/index"

import { Section } from "./section"
import { PostCard } from "@/components/noticias/post-card"

type FreshPost = inferRouterOutputs<AppRouter>["posts"]["fresh"][number]

interface PostsSectionProps {
  posts: FreshPost[]
}

export function Hero({ posts }: PostsSectionProps) {
  const mainPosts = posts.slice(0, 2)

  return (
    <Section main={true}>
      <div className="relative grid sm:grid-cols-2 gap-6">
        {mainPosts.map((post) => (
          <PostCard key={post.id} main headingLevel="h2" imageUrl={post.imageUrl} slug={post.slug} title={post.title} />
        ))}
      </div>
    </Section>
  )
}
