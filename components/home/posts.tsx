import { NewspaperIcon } from "lucide-react"

import type { FreshPost } from "@/db/queries"

import { Section } from "./section"
import { DottedButton } from "@/components/dotted-button"
import { DottedSeparator } from "@/components/dotted-separator"
import { DottedX } from "@/components/dotted-x"
import { PostCard } from "@/components/post-card"

interface PostsSectionProps {
	posts: FreshPost[]
}

export function Posts({ posts }: PostsSectionProps) {
	const freshPosts = posts.slice(2, 6)

	return (
		<Section icon={NewspaperIcon} label="Notícias" main={false}>
			<DottedX className="p-0">
				<div className="grid sm:grid-cols-2 gap-0">
					<div className="absolute top-1/2 left-0 w-full -translate-y-1/2 z-0 hidden md:block">
						<DottedSeparator />
					</div>
					<div className="absolute left-1/2 top-0 h-full -translate-x-1/2 z-0 hidden md:block">
						<DottedSeparator vertical />
					</div>
					{freshPosts?.map((posts: FreshPost, index: number) => (
						<div key={posts.id}>
							<PostCard
								id={posts.id}
								image={posts.image ?? null}
								key={posts.id}
								slug={posts.slug ?? null}
								title={posts.title}
							/>
							{index !== freshPosts.length - 1 && (
								<DottedSeparator className="w-full sm:hidden" />
							)}
						</div>
					))}
				</div>
			</DottedX>
			<DottedButton href="/noticias" label="Ver Notícias" />
		</Section>
	)
}
