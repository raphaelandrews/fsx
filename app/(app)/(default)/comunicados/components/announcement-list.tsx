import { getAnnouncementsByPage } from "@/db/queries"

import { AnnouncementLink } from "@/components/announcement-link"
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

interface AnnouncementListProps {
	currentPage: number
}

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

export async function AnnouncementList({ currentPage }: AnnouncementListProps) {
	const { announcements, pagination } =
		await getAnnouncementsByPage(currentPage)()
	const { totalPages, hasNextPage, hasPreviousPage } = pagination

	return (
		<>
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
							),
						)}

						<PaginationItem>
							<PaginationNext
								aria-disabled={!hasNextPage}
								className={hasNextPage ? "" : "pointer-events-none opacity-50"}
								href={`/comunicados?page=${Math.min(
									totalPages,
									currentPage + 1,
								)}`}
							/>
						</PaginationItem>
						<PaginationItem>
							<PaginationLast
								aria-disabled={!hasNextPage}
								className={hasNextPage ? "" : "pointer-events-none opacity-50"}
								href={`/comunicados?page=${totalPages}`}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}
		</>
	)
}
