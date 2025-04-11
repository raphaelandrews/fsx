"use client";

import { useState } from "react";

import type { FreshAnnouncements } from "@/schemas/announcements";

import AnnouncementsModal from "@/components/modals/announcements-modal";
import { Card, CardContent } from "@/components/ui/card";

const AnnouncementLink = ({ id, year, number, content }: FreshAnnouncements) => {
  const [isOpen, setIsOpen] = useState(false);

  function handleClick() {
    setIsOpen(!isOpen);
  }

  return (
    <>
      <Card
        onClick={handleClick}
        className="bg-card hover:bg-accent rounded-lg transition-all hover:cursor-pointer"
      >
        <CardContent className="grid gap-2 p-3">
          <p className="font-medium text-sm line-clamp-1 webkit-line-clamp-1">
            nº {number}/{year}
          </p>
          <p className="text-sm text-muted-foreground line-clamp-2  webkit-line-clamp-2">
            {content}
          </p>
        </CardContent>
      </Card>

      {isOpen && (
        <AnnouncementsModal
          year={year}
          number={number}
          content={content}
          handleClick={handleClick}
          setIsOpen={setIsOpen}
        />
      )}
    </>
  );
};

export default AnnouncementLink;
