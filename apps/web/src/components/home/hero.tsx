import { Section } from "./section"
import { PostCard } from "@/components/post-card"

interface FreshPost {
  id: number
  title: string
  imageUrl: string | null
  slug: string | null
}

interface PostsSectionProps {
  posts: FreshPost[]
}

export function Hero({ posts }: PostsSectionProps) {
  const mainPosts = posts.slice(0, 2)

  return (
    <Section main={true}>
      <div className="relative grid sm:grid-cols-2 gap-0">
        {mainPosts?.map((post: FreshPost) => (
          <div key={post.id}>
            <PostCard
              imageUrl={post.imageUrl ?? null}
              main={true}
              slug={post.slug ?? undefined}
              title={post.title}
            />
          </div>
        ))}
      </div>
    </Section>
  )
}
