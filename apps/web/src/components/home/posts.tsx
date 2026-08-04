import { NewsIcon } from "@hugeicons/core-free-icons"

import { Section } from "./section"
import { DottedButton } from "@/components/dotted-button"
import { DottedSeparator } from "@/components/dotted-separator"
import { PostCard } from "@/components/post-card"

interface FreshPost {
	id: string
	title: string
	image: string | null
	slug: string | null
}

interface PostsSectionProps {
	posts: FreshPost[]
}

export function Posts({ posts }: PostsSectionProps) {
	const freshPosts = posts.slice(2, 6)

	return (
		<Section icon={NewsIcon} label="Notícias" main={false}>
			<div className="relative grid sm:grid-cols-2 gap-0">
					<div className="absolute top-1/2 left-0 w-full -translate-y-1/2 z-0 hidden md:block">
						<DottedSeparator />
					</div>
					<div className="absolute left-1/2 top-0 h-full -translate-x-1/2 z-0 hidden md:block">
						<DottedSeparator vertical />
					</div>
					{freshPosts?.map((post: FreshPost, index: number) => (
						<div key={post.id}>
							<PostCard
								image={post.image ?? null}
								key={post.id}
								slug={post.slug ?? undefined}
								title={post.title}
							/>
							{index !== freshPosts.length - 1 && (
								<DottedSeparator className="w-full sm:hidden" />
							)}
						</div>
					))}
			</div>
			<DottedButton href="/noticias" label="Ver Notícias" />
		</Section>
	)
}
