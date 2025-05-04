import { useState } from "react";

import type { Announcement } from "~/db/queries";
import { AnnouncementsModal } from "~/components/modals/announcements-modal";

export function AnnouncementLink({ year, number, content }: Announcement) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleModal = () => setIsOpen((prev) => !prev);

  return (
    <>
      <button
        onClick={toggleModal}
        type="button"
        tabIndex={0}
        className="text-left px-3 py-2 bg-primary-foreground rounded-md hover:bg-muted hover:cursor-pointer"
        aria-label={`View announcement ${number}/${year}`}
      >
        <p className="font-medium text-sm text-primary line-clamp-1">
          <span className="text-xs">
            Nº {number}/{year}:
          </span>{" "}
          {content}
        </p>
      </button>

      <AnnouncementsModal
        open={isOpen}
        onOpenChange={toggleModal}
        year={year}
        number={number}
        content={content}
      />
    </>
  );
}
