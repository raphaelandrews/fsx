
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUpRight01Icon, Megaphone01Icon, ScrollIcon } from "@hugeicons/core-free-icons"

import { Section } from "./section"
import { AnnouncementsModal } from "@/components/modals/announcements-modal"
import { SectionButton } from "@/components/section-button"
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
      <div className="grid md:grid-cols-2">
        {announcements?.map((announcement: AnnouncementType) => (
          <AnnouncementItem
            key={announcement.id}
            announcement={announcement}
          />
        ))}
      </div>
      <SectionButton href="/comunicados" label="Ver Comunicados" />
    </Section>
  )
}

function AnnouncementItem({
  announcement,
}: { announcement: AnnouncementType }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <AnnouncementsModal
      content={announcement.content}
      number={padNumber(announcement.number)}
      onOpenChange={setIsOpen}
      open={isOpen}
      trigger={
        <button
          type="button"
          className="m-1 flex w-full items-center justify-between rounded-md p-3 select-none text-left transition-colors duration-300 hover:bg-muted/50 group"
        >
          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={ScrollIcon} size={14} className="text-muted-foreground" />
                <h3 className="text-sm font-bold leading-tight">
                  Comunicado {padNumber(announcement.number)}/{announcement.year}
                </h3>
              </div>
              <div className="text-muted-foreground transition-colors group-hover:text-foreground">
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} />
              </div>
            </div>
            <p className="text-muted-foreground text-xs line-clamp-2">
              {announcement.content}
            </p>
          </div>
        </button>
      }
      year={announcement.year}
    />
  )
}
