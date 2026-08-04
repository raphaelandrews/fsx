import { FireIcon } from "@hugeicons/core-free-icons"

import { Section } from "./section"
import { PostCard } from "@/components/post-card"
import { DottedSeparator } from "@/components/dotted-separator"

interface FreshPost {
	id: string
	title: string
	image: string | null
	slug: string | null
}

interface PostsSectionProps {
	posts: FreshPost[]
}

export function Hero({ posts }: PostsSectionProps) {
	const mainPosts = posts.slice(0, 2)

	return (
		<Section icon={FireIcon} main={true}>
			<div className="relative grid sm:grid-cols-2 gap-0">
					<div className="absolute left-1/2 top-0 h-full -translate-x-1/2 z-0 hidden md:block">
						<DottedSeparator vertical />
					</div>
					{mainPosts?.map((post: FreshPost, index: number) => (
						<div key={post.id}>
							<PostCard
								image={post.image ?? null}
								main={true}
								slug={post.slug ?? undefined}
								title={post.title}
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
