import { getAnnouncementsByPage } from "@/db/queries"

import { DottedSeparator } from "@/components/dotted-separator"
import { DottedX } from "@/components/dotted-x"
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
import { AnnouncementItem } from "./announcement-item"

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
			<DottedX className="p-0">
				<div className="flex flex-col">
					{announcements.map((announcement, index) => (
						<AnnouncementItem
							key={announcement.number}
							announcement={announcement}
							isLast={index === announcements.length - 1}
						/>
					))}
				</div>
			</DottedX>

			{totalPages > 1 && (
				<div className="w-full">
					<DottedSeparator />
					<DottedX className="p-2 relative">
						<Pagination>
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
					</DottedX>
				</div>
			)}
		</>
	)
}
