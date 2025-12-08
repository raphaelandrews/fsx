import { Suspense } from "react"
import type { Metadata } from "next"
import { NewspaperIcon } from "lucide-react"

import { getPostsByPage } from "@/db/queries"
import { siteConfig } from "@/lib/site"

import { Announcement } from "@/components/announcement"
import { PostCard } from "@/components/post-card"
import { PageHeader, PageHeaderHeading } from "@/components/ui/page-header"
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationFirst,
	PaginationItem,
	PaginationLast,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
	title: "Notícias",
	description: "Notícias e eventos da Federação Sergipana de Xadrez.",
	openGraph: {
		url: `${siteConfig.url}/noticias`,
		title: "Notícias",
		description: "Notícias e eventos da Federação Sergipana de Xadrez.",
		siteName: "Notícias",
	},
}

export async function generateStaticParams() {
	return [
		{ searchParams: { page: "1" } },
		{ searchParams: { page: "2" } },
		{ searchParams: { page: "3" } },
	]
}

async function NewsContent({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
	const resolvedSearchParams = await searchParams
	const currentPage = Number(resolvedSearchParams.page) || 1

	const { posts, pagination } = await getPostsByPage(currentPage)
	const { totalPages, hasNextPage, hasPreviousPage } = pagination

	const getPageNumbers = (totalPages: number, currentPage: number) => {
		const MAX_VISIBLE_PAGES = 5
		let pageNumbers: Array<number | "ellipsis"> = []

		if (totalPages <= MAX_VISIBLE_PAGES) {
			pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
		} else {
			const start = Math.max(1, currentPage - 2)
			const end = Math.min(totalPages, currentPage + 2)

			if (start > 1) pageNumbers.push(1)
			if (start > 2) pageNumbers.push("ellipsis")

			for (let i = start; i <= end; i++) {
				pageNumbers.push(i)
			}

			if (end < totalPages - 1) pageNumbers.push("ellipsis")
			if (end < totalPages) pageNumbers.push(totalPages)
		}

		return pageNumbers
	}

	return (
		<section>
			<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
				{posts.map((post) => (
					<PostCard
						id={post.id}
						image={post.image ?? undefined}
						key={post.id}
						slug={post.slug ?? ""}
						title={post.title}
					/>
				))}
			</div>

			{totalPages > 1 && (
				<Pagination className="mt-16">
					<PaginationContent>
						<PaginationItem>
							<PaginationFirst
								aria-disabled={!hasPreviousPage}
								className={
									hasPreviousPage ? "" : "pointer-events-none opacity-50"
								}
								href="/noticias?page=1"
							/>
						</PaginationItem>
						<PaginationItem>
							<PaginationPrevious
								aria-disabled={!hasPreviousPage}
								className={
									hasPreviousPage ? "" : "pointer-events-none opacity-50"
								}
								href={`/noticias?page=${Math.max(1, currentPage - 1)}`}
							/>
						</PaginationItem>

						{getPageNumbers(totalPages, currentPage).map((pageNum) =>
							pageNum === "ellipsis" ? (
								<PaginationItem key={`ellipsis-${crypto.randomUUID()}`}>
									<PaginationEllipsis />
								</PaginationItem>
							) : (
								<PaginationItem key={pageNum}>
									<PaginationLink
										href={`/noticias?page=${pageNum}`}
										isActive={pageNum === currentPage}
									>
										{pageNum}
									</PaginationLink>
								</PaginationItem>
							),
						)}

						<PaginationItem>
							<PaginationNext
								aria-disabled={!hasNextPage}
								className={hasNextPage ? "" : "pointer-events-none opacity-50"}
								href={`/noticias?page=${Math.min(totalPages, currentPage + 1)}`}
							/>
						</PaginationItem>
						<PaginationItem>
							<PaginationLast
								aria-disabled={!hasNextPage}
								className={hasNextPage ? "" : "pointer-events-none opacity-50"}
								href={`/noticias?page=${totalPages}`}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}
		</section>
	)
}

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
	return (
		<>
			<PageHeader>
				<Announcement icon={NewspaperIcon} />
				<PageHeaderHeading>Notícias</PageHeaderHeading>
			</PageHeader>

			<Suspense
				fallback={
					<section>
						<div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
							{Array.from({ length: 12 }).map((_, i) => (
								<div key={`skeleton-${i}`}>
									<Skeleton className="aspect-[2/1] w-full" />
									<Skeleton className="mt-2 mb-1 h-5 w-full" />
									<Skeleton className="h-5 w-4/5" />
								</div>
							))}
						</div>
					</section>
				}
			>
				<NewsContent searchParams={searchParams} />
			</Suspense>
		</>
	)
}
