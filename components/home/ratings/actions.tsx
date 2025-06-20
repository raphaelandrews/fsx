"use client"

import React from "react";

import { formatDefendingChampions } from "@/lib/defending-champions";
import { getGradient } from "@/lib/generate-gradients";

import { PlayerSheet } from "@/components/sheets/player/player-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  id: number;
  name: string;
  nickname?: string | null;
  image?: string | null;
  shortTitle?: string | null;
  defendingChampions?:
    | {
        championship: {
          name: string;
        };
      }[]
    | null;
}

export const Actions = ({
  id,
  name,
  nickname,
  image,
  shortTitle,
  defendingChampions,
}: Props) => {
  const [open, setOpen] = React.useState(false);
  const gradient = getGradient(id); 

  const handleKeyboardEvent = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 group">
        <div
          onClick={() => setOpen(true)}
          onKeyUp={handleKeyboardEvent}
          onKeyDown={handleKeyboardEvent}
          className="flex items-center gap-3 cursor-pointer transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
          aria-label={`View ${name}'s profile`}
        >
          <Avatar className="size-8 rounded-md">
            <AvatarImage src={image ?? undefined} alt={name} />
            <AvatarFallback style={gradient} />
          </Avatar>
          <div className="font-medium whitespace-nowrap">
            {shortTitle && <span className="text-gold">{shortTitle}</span>}{" "}
            {nickname ?? name}
          </div>
        </div>

        {defendingChampions && (
          <div className="flex items-center gap-2">
            {defendingChampions.map((championship) => (
              <div key={championship.championship.name}>
                {formatDefendingChampions(championship.championship.name, 16)}
              </div>
            ))}
          </div>
        )}
      </div>

      <PlayerSheet id={id} open={open} setOpen={setOpen} />
    </>
  );
};
