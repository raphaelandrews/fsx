import { NewsIcon } from "@hugeicons/core-free-icons"
import type { inferRouterOutputs } from "@trpc/server"

import type { AppRouter } from "@fsx/api/routers/index"

import { Section } from "./section"
import { SectionButton } from "@/components/section-button"
import { PostCard } from "@/components/post-card"

type FreshPost = inferRouterOutputs<AppRouter>["posts"]["fresh"][number]

interface PostsSectionProps {
  posts: FreshPost[]
}

export function Posts({ posts }: PostsSectionProps) {
  const freshPosts = posts.slice(2, 8)

  return (
    <Section icon={NewsIcon} label="Notícias" main={false}>
      <div className="relative grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {freshPosts?.map((post: FreshPost) => (
          <div key={post.id}>
            <PostCard
              imageUrl={post.imageUrl ?? null}
              key={post.id}
              slug={post.slug ?? undefined}
              title={post.title}
            />
          </div>
        ))}
      </div>
      <SectionButton href="/noticias" label="Ver Notícias" />
    </Section>
  )
}
