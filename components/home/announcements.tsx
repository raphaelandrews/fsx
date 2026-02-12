import { MegaphoneIcon } from "lucide-react"

import type { AnnouncementByPage as AnnouncementType } from "@/db/queries"

import { Section } from "./section"
import { AnnouncementLink } from "@/components/announcement-link"
import { DottedX } from "@/components/dotted-x"

interface AnnouncementsSectionProps {
	announcements: AnnouncementType[]
}

export function Announcements({ announcements }: AnnouncementsSectionProps) {
	return (
		<Section
			icon={MegaphoneIcon}
			label="Comunicados"
			main={false}
		>
			<DottedX>
				<div className="grid gap-1.5 md:grid-cols-2">
					{announcements?.map((announcement: AnnouncementType) => (
						<AnnouncementLink
							content={announcement.content}
							id={announcement.id}
							key={announcement.number}
							number={announcement.number}
							year={announcement.year}
						/>
					))}
				</div>
			</DottedX>
		</Section>
	)
}
