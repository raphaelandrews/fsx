
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUpRight01Icon, Megaphone01Icon, ScrollIcon } from "@hugeicons/core-free-icons"

import { Section } from "./section"
import { AnnouncementsModal } from "@/components/modals/announcements-modal"
import { DottedButton } from "@/components/dotted-button"
import { padNumber } from "@/utils/format"

interface AnnouncementType {
  id: number
  number: number
  year: number
  content: string
}

interface AnnouncementsSectionProps {
	announcements: AnnouncementType[]
}

export function Announcements({ announcements }: AnnouncementsSectionProps) {
	return (
		<Section
			icon={Megaphone01Icon}
			label="Comunicados"
			main={false}
		>
			<div className="flex flex-col">
				{announcements?.map((announcement: AnnouncementType) => (
					<AnnouncementItem
						key={announcement.id}
						announcement={announcement}
					/>
				))}
			</div>
			<DottedButton href="/comunicados" label="Ver Comunicados" />
		</Section>
	)
}

function AnnouncementItem({
	announcement,
}: { announcement: AnnouncementType }) {
	const [isOpen, setIsOpen] = useState(false)

	return (
		<>
			<div>
				<div className="m-1">
					<div
						className="flex items-center justify-between group hover:bg-muted/50 transition-colors duration-300 p-3 select-none"
						onClick={() => setIsOpen(true)}
					>
						<div className="flex flex-col gap-2 w-full">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<HugeiconsIcon icon={ScrollIcon} size={14} className="text-muted-foreground" />
									<h3 className="text-sm font-bold leading-tight">
										Comunicado {padNumber(announcement.number)}/{announcement.year}
									</h3>
								</div>
								<div className="text-muted-foreground group-hover:text-foreground transition-colors">
									<HugeiconsIcon icon={ArrowUpRight01Icon} size={14} />
								</div>
							</div>
							<p className="text-muted-foreground text-xs line-clamp-2">
								{announcement.content}
							</p>
						</div>
					</div>
				</div>
			</div>

			<AnnouncementsModal
				content={announcement.content}
				number={padNumber(announcement.number)}
				onOpenChange={setIsOpen}
				open={isOpen}
				year={announcement.year}
			/>
		</>
	)
}
