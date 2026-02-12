import { FlameIcon } from "lucide-react"

import type { FreshPost } from "@/db/queries"

import { Section } from "./section"
import { DottedX } from "@/components/dotted-x"
import { PostCard } from "@/components/post-card"
import { DottedSeparator } from "@/components/dotted-separator"

interface PostsSectionProps {
	posts: FreshPost[]
}

export function Hero({ posts }: PostsSectionProps) {
	const mainPosts = posts.slice(0, 2)

	return (
		<Section className="!mt-4" icon={FlameIcon} main={true}>
			<DottedSeparator />
			<DottedX>
				<div className="grid gap-8 sm:grid-cols-2">
					{mainPosts?.map((posts: FreshPost) => (
						<PostCard
							id={posts.id}
							image={posts.image ?? null}
							key={posts.id}
							main={true}
							slug={posts.slug ?? null}
							title={posts.title}
						/>
					))}
				</div>
			</DottedX>
		</Section>
	)
}
