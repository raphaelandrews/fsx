import React from "react"
import type { Metadata } from "next"
import { MegaphoneIcon } from "lucide-react"

import { getAnnouncementsByPage } from "@/db/queries"
import { siteConfig } from "@/lib/site"

import { Announcement } from "@/components/announcement"
import { AnnouncementLink } from "@/components/announcement-link"
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

export const revalidate = 2_592_000

export const metadata: Metadata = {
  title: "Comunicados",
  description: "Comunicados da FSX",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${siteConfig.url}/comunicados`,
    title: "FSX | Comunicados",
    description: "Comunicados da Federação Sergipana de Xadrez",
    siteName: "FSX | Comunicados",
    images: [
      {
        url: `/og?title=${encodeURIComponent("Comunicados")}`,
      },
    ],
  },
};

export async function generateStaticParams() {
	return [
		{ searchParams: { page: "1" } },
		{ searchParams: { page: "2" } },
		{ searchParams: { page: "3" } },
	]
}

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
	const resolvedSearchParams = await searchParams
	const currentPage = Number(resolvedSearchParams.page) || 1

	const { announcements, pagination } =
		await getAnnouncementsByPage(currentPage)
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
		<>
			<PageHeader>
				<Announcement icon={MegaphoneIcon} />
				<PageHeaderHeading>Comunicados</PageHeaderHeading>
			</PageHeader>

			<section>
				<React.Suspense
					fallback={
						<div className="grid gap-1.5 md:grid-cols-2">
							{Array.from({ length: 12 }).map((_) => (
								<Skeleton
									className="h-9 w-full rounded-md"
									key={`skeleton-${crypto.randomUUID()}`}
								/>
							))}
						</div>
					}
				>
					<div className="grid gap-1.5 md:grid-cols-2">
						{announcements.map((announcement) => (
							<AnnouncementLink
								content={announcement.content}
								id={announcement.id}
								key={announcement.number}
								number={announcement.number}
								year={announcement.year}
							/>
						))}
					</div>
				</React.Suspense>

				{totalPages > 1 && (
					<Pagination className="mt-16">
						<PaginationContent>
							<PaginationItem>
								<PaginationFirst
									aria-disabled={!hasPreviousPage}
									className={
										hasPreviousPage ? "" : "pointer-events-none opacity-50"
									}
									href="/comunicados?page=1"
								/>
							</PaginationItem>
							<PaginationItem>
								<PaginationPrevious
									aria-disabled={!hasPreviousPage}
									className={
										hasPreviousPage ? "" : "pointer-events-none opacity-50"
									}
									href={`/comunicados?page=${Math.max(1, currentPage - 1)}`}
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
											href={`/comunicados?page=${pageNum}`}
											isActive={pageNum === currentPage}
										>
											{pageNum}
										</PaginationLink>
									</PaginationItem>
								)
							)}

							<PaginationItem>
								<PaginationNext
									aria-disabled={!hasNextPage}
									className={
										hasNextPage ? "" : "pointer-events-none opacity-50"
									}
									href={`/comunicados?page=${Math.min(
										totalPages,
										currentPage + 1
									)}`}
								/>
							</PaginationItem>
							<PaginationItem>
								<PaginationLast
									aria-disabled={!hasNextPage}
									className={
										hasNextPage ? "" : "pointer-events-none opacity-50"
									}
									href={`/comunicados?page=${totalPages}`}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				)}
			</section>
		</>
	)
}
