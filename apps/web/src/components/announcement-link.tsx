"use client"

import { useState } from "react"

import { HugeiconsIcon } from "@hugeicons/react"
import { ScrollIcon } from "@hugeicons/core-free-icons"

interface AnnouncementLinkProps {
  year: number
  number: number
  content: string
}

function AnnouncementModal({
  content,
  number,
  year,
  open,
  onOpenChange,
}: {
  content: string
  number: number
  year: number
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => onOpenChange(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") onOpenChange(false)
      }}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-auto rounded-lg bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onOpenChange(false)
        }}
      >
        <h2 className="mb-4 font-semibold text-lg">
          N. {number}/{year}
        </h2>
        <p className="text-muted-foreground">{content}</p>
      </div>
    </div>
  )
}

export function AnnouncementLink({
  year,
  number,
  content,
}: AnnouncementLinkProps) {
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
        <HugeiconsIcon className="size-3.5 shrink-0" icon={ScrollIcon} />
        <p className="line-clamp-1 font-medium text-primary text-sm">
          <span className="text-xs">
            N. {number}/{year}:
          </span>{" "}
          {content}
        </p>
      </button>

      <AnnouncementModal
        content={content}
        number={number}
        open={isOpen}
        onOpenChange={setIsOpen}
        year={year}
      />
    </>
  )
}
