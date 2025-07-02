import { NewspaperIcon } from "lucide-react"

import type { FreshPost } from "@/db/queries"

import { Section } from "./section"
import { PostCard } from "@/components/post-card"

interface PostsSectionProps {
	posts: FreshPost[]
}

export function Posts({ posts }: PostsSectionProps) {
	const freshPosts = posts.slice(2, 6)

	return (
		<Section
			href="/noticias"
			icon={NewspaperIcon}
			label="Notícias"
			main={false}
		>
			<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
				{freshPosts?.map((posts: FreshPost) => (
					<PostCard
						id={posts.id}
						image={posts.image ?? null}
						key={posts.id}
						slug={posts.slug ?? null}
						title={posts.title}
					/>
				))}
			</div>
		</Section>
	)
}
