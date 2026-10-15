import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"

import Editor from "./components/editor"
import { Separator } from "@/components/ui/separator"
import { db } from "@/db"
import { posts } from "@/db/schema"

export interface Post {
	id: string
	title: string
	image: string
	content: string
	slug: string
	updatedAt: Date | null
}

async function getPost(postId: string) {
	const data = await db
		.select()
		.from(posts)
		.where(eq(posts.id, postId))
		.limit(1)

	if (data.length === 0) {
		return null
	}

	return data[0]
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
	const post = await getPost((await props.params).id)

	if (!post) {
		return notFound()
	}

	return (
		<>
			<div>
				<h3 className="font-medium text-lg">Editor</h3>
				<p className="py-2 text-muted-foreground text-sm">Update your post</p>
			</div>
			<Separator className="mb-5" />
			<Editor post={post} />
		</>
	)
}
