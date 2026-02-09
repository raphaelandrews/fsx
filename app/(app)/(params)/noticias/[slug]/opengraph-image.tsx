import { ImageResponse } from "next/og"
import { getPostBySlug } from "@/db/queries"
import { generateDefaultOG, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-utils"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Notícia"

export default async function Image({
	params,
}: {
	params: Promise<{ slug: string }>
}) {
	const { slug } = await params
	const post = await getPostBySlug(slug)()

	if (!post || !post.image) {
		return generateDefaultOG({
			title: post?.title || "Notícia",
			description: post?.content || "Notícia da Federação Sergipana de Xadrez.",
		})
	}

	// Use the post's cover image directly
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
			}}
		>
			<img
				src={post.image}
				alt={post.title}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
				}}
			/>
		</div>,
		{
			...OG_SIZE,
		}
	)
}
