import { FlameIcon } from "lucide-react"

import type { FreshPost } from "@/db/queries"

import { Section } from "./section"
import { PostCard } from "@/components/post-card"
import { DottedSeparator } from "@/components/dotted-separator"

interface PostsSectionProps {
	posts: FreshPost[]
}

export function Hero({ posts }: PostsSectionProps) {
	const mainPosts = posts.slice(0, 2)

	return (
		<Section icon={FlameIcon} main={true}>
			<div className="relative grid sm:grid-cols-2 gap-0">
					<div className="absolute left-1/2 top-0 h-full -translate-x-1/2 z-0 hidden md:block">
						<DottedSeparator vertical />
					</div>
					{mainPosts?.map((posts: FreshPost, index: number) => (
						<div key={posts.id}>
							<PostCard
								id={posts.id}
								image={posts.image ?? null}
								main={true}
								slug={posts.slug ?? null}
								title={posts.title}
							/>
							{index !== mainPosts.length - 1 && (
								<DottedSeparator className="w-full sm:hidden" />
							)}
						</div>
					))}
			</div>
		</Section>
	)
}
