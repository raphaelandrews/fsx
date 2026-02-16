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

	if (post?.image) {
		return new ImageResponse(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					backgroundColor: "#000",
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
			{ ...OG_SIZE }
		)
	}

	// Fallback if no image
	return generateDefaultOG({
		title: post?.title || "Notícia",
	})
}
