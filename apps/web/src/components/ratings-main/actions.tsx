"use client";

import { useMemo, useState } from "react";

import { formatDefendingChampions } from "@/lib/defending-champions";
import { getGradient } from "@/lib/generate-gradients";

import PlayerModal from "@/components/modals/player-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  id: number;
  name: string;
  nickname?: string | null;
  image?: string | null;
  shortTitle?: string | null;
  defendingChampions?:
    | {
        championships: {
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
  const [open, setOpen] = useState(false);
  const gradient = useMemo(() => getGradient(), []);

  const handleKeyboardEvent = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      setOpen(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <div
          onClick={() => setOpen(true)}
          onKeyUp={handleKeyboardEvent}
          onKeyDown={handleKeyboardEvent}
          className="flex items-center gap-3 cursor-pointer"
          role="button"
          tabIndex={0}
        >
          <Avatar className="w-8 h-8 rounded-md">
            <AvatarImage src={image ? image : ""} alt={name} />
            <AvatarFallback style={gradient} />
          </Avatar>
          <div className="font-medium whitespace-nowrap">
            <span className="text-gold">{shortTitle}</span>{" "}
            {nickname ? nickname : name}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {defendingChampions?.map((championship) => (
            <div key={championship.championships.name}>
              {formatDefendingChampions(championship.championships.name, 16)}
            </div>
          ))}
        </div>
      </div>

      {open && <PlayerModal id={id} open={open} setOpen={setOpen} />}
    </>
  );
};
