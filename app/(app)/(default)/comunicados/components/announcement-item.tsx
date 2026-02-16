"use client"

import { useState } from "react"
import { ArrowUpRight, ScrollTextIcon } from "lucide-react"

import type { AnnouncementByPage as AnnouncementType } from "@/db/queries"

import { DottedSeparator } from "@/components/dotted-separator"
import { AnnouncementsModal } from "@/components/modals/announcements-modal"

export function AnnouncementItem({
  announcement,
  isLast,
}: { announcement: AnnouncementType; isLast: boolean }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div>
        <div className="m-1">
          <div
            className="flex items-center justify-between group hover:bg-muted/50 transition-colors duration-300 p-3 select-none cursor-pointer"
            onClick={() => setIsOpen(true)}
          >
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ScrollTextIcon size={14} className="text-muted-foreground" />
                  <h3 className="text-sm font-bold leading-tight">
                    Comunicado {announcement.number}/{announcement.year}
                  </h3>
                </div>
                <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                  <ArrowUpRight size={14} />
                </div>
              </div>
              <p className="text-muted-foreground text-xs line-clamp-2">
                {announcement.content}
              </p>
            </div>
          </div>
        </div>
        {!isLast && <DottedSeparator className="w-full" />}
      </div>

      <AnnouncementsModal
        content={announcement.content}
        number={announcement.number}
        onOpenChange={setIsOpen}
        open={isOpen}
        year={announcement.year}
      />
    </>
  )
}
