import { useState } from "react";

import type { AnnouncementsResponse } from "@fsx/engine/queries";

import AnnouncementsModal from "~/components/modals/announcements-modal";
import { Card, CardContent } from "~/components/ui/card";

type AnnouncementLinkProps = AnnouncementsResponse;

const AnnouncementLink = ({
  id,
  year,
  number,
  content,
}: AnnouncementLinkProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleModal = () => setIsOpen((prev) => !prev);

  return (
    <>
      <Card
        onClick={toggleModal}
        className="bg-card hover:bg-accent rounded-lg transition-colors cursor-pointer"
        aria-label={`View announcement ${number}/${year}`}
        tabIndex={0}
      >
        <CardContent className="grid gap-2 p-3">
          <p className="text-sm font-medium line-clamp-1">
            nº {number}/{year}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {content}
          </p>
        </CardContent>
      </Card>

      <AnnouncementsModal
        open={isOpen}
        onOpenChange={toggleModal}
        year={year}
        number={number}
        content={content}
      />
    </>
  );
};

export default AnnouncementLink;
