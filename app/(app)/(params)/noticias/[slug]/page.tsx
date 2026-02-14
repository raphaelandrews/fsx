import { ViewTransition } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { NewspaperIcon } from "lucide-react"

import { getPosts, getPostBySlug } from "@/db/queries"
import { siteConfig } from "@/lib/site"
import { MDX } from "@/components/mdx"
import { PostTimeAgo } from "../components/post-time-ago"
import { DottedSeparator } from "@/components/dotted-separator"
import { PageHeader } from "@/components/ui/page-header"

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
		<PageHeader icon={NewspaperIcon} label="Notícia">
			{/* Title Section */}
			<section className="mb-0">
				<div className="p-4">
					<ViewTransition name={`title-${data?.slug}`}>
						<h1 className="text-balance font-semibold text-xl text-primary tracking-tighter">
							{data?.title}
						</h1>
					</ViewTransition>

					{data?.createdAt && (
						<div className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
							<PostTimeAgo date={data.createdAt} />
						</div>
					)}
				</div>
				<DottedSeparator />
			</section>

			{/* Image Section */}
			{data?.image && (
				<section className="mb-0">
					<div className="p-4">
						<ViewTransition name={`image-${data?.slug}`}>
							<img
								alt={data.title}
								className="w-full rounded-lg object-cover max-h-[400px]"
								src={data.image}
							/>
						</ViewTransition>
					</div>
					<DottedSeparator />
				</section>
			)}

			{/* Content Section */}
			{data?.content && (
				<section className="mb-0 p-4">
					<MDX content={data.content} />
				</section>
			)}
		</PageHeader>
	)
}
