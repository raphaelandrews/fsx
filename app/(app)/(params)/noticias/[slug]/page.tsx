import { ViewTransition } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { NewspaperIcon } from "lucide-react"

import { getPosts, getPostBySlug } from "@/db/queries"
import { siteConfig } from "@/lib/site"
import { MDX } from "@/components/mdx"
import { PostTimeAgo } from "../components/post-time-ago"

export async function generateStaticParams() {
	const posts = await getPosts()

	return posts.map((post) => ({
		slug: post.slug,
	}))
}

export async function generateMetadata({
	params,
}: {
	params: Promise<Record<string, string | string[] | undefined>>
}): Promise<Metadata> {
	const resolvedParams = await params
	const posts = await getPostBySlug(resolvedParams.slug as string)()

	if (!posts) {
		return {
			title: "Notícia não encontrada",
		}
	}

	const { title, image, content } = posts

	return {
		title,
		description: content,
		openGraph: {
			title,
			description: content,
			siteName: title,
			url: `${siteConfig.url}/noticias/${resolvedParams.slug}`,
			images: [
				{
					url: image,
					width: 1200,
					height: 600,
				},
			],
		},
	}
}

export default async function Page({
	params,
}: {
	params: Promise<Record<string, string | string[] | undefined>>
}) {
	const resolvedParams = await params
	const data = await getPostBySlug(resolvedParams.slug as string)()

	if (!data) {
		notFound()
	}

	return (
		<section className="m-auto w-11/12 max-w-2xl pt-12 pb-20">
			<div className="inline-block rounded-md bg-primary-foreground p-2.5 text-muted-foreground">
				<NewspaperIcon height={16} width={16} />
			</div>

			<ViewTransition name={`title-${data?.slug}`}>
				<h1 className="text-balance font-semibold text-2xl text-primary mt-2 tracking-tighter">
					{data?.title}
				</h1>
			</ViewTransition>

			{data?.createdAt && (
				<div className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
					<PostTimeAgo date={data.createdAt} />
				</div>
			)}

			<ViewTransition name={`image-${data?.slug}`}>
				{data?.image && (
					// biome-ignore lint/performance/noImgElement: No
					<img
						alt={data.title}
						className="m-auto mt-6 h-full w-full max-w-xl rounded-lg"
						src={data.image}
					/>
				)}
			</ViewTransition>

			<div className="mt-6">
				{data?.content && <MDX content={data.content} />}
			</div>
		</section>
	)
}
