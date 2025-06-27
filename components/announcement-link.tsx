"use client"

import { useState } from "react"

import type { AnnouncementByPage } from "@/db/queries"
import { AnnouncementsModal } from "@/components/modals/announcements-modal"
import { ScrollTextIcon } from "lucide-react"

export function AnnouncementLink({
	year,
	number,
	content,
}: AnnouncementByPage) {
	const [isOpen, setIsOpen] = useState(false)
	const toggleModal = () => setIsOpen((prev) => !prev)

	return (
		<>
			<button
				aria-label={`View announcement ${number}/${year}`}
				className="flex items-center gap-2 rounded-md bg-primary-foreground px-3 py-2 text-left hover:cursor-pointer hover:bg-muted"
				onClick={toggleModal}
				tabIndex={0}
				type="button"
			>
				<ScrollTextIcon className="size-3.5 shrink-0" />
				<p className="line-clamp-1 font-medium text-primary text-sm">
					<span className="text-xs">
						Nº {number}/{year}:
					</span>{" "}
					{content}
				</p>
			</button>

			<AnnouncementsModal
				content={content}
				number={number}
				onOpenChange={toggleModal}
				open={isOpen}
				year={year}
			/>
		</>
	)
}
