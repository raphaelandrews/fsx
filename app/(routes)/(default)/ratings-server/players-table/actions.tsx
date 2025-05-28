import React from "react";

import { getGradient } from "@/lib/generate-gradients";
import { formatDefendingChampions } from "@/lib/defending-champions";

import PlayerModal from "@/components/modals/player-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  id: number;
  name: string;
  nickname?: string | null;
  imageUrl?: string | null;
  playersToTitles?: {
    title: {
      type: "internal" | "external";
      title?: string;
      shortTitle?: string;
    };
  }[];
  defendingChampions?: {
    championship: {
      name: string;
    };
  }[];
}

export const Actions = ({
  id,
  name,
  nickname,
  imageUrl,
  playersToTitles,
  defendingChampions,
}: Props) => {
  const [open, setOpen] = React.useState(false);
  const gradient = React.useMemo(() => getGradient(id), [id]);

  const internalTitles = React.useMemo(() => {
    return (
      playersToTitles?.filter((title) => title.title.type === "internal") || []
    );
  }, [playersToTitles]);

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
        >
          <Avatar className="w-8 h-8 rounded-md">
            <AvatarImage src={imageUrl || undefined} alt={name} />
            <AvatarFallback style={gradient} />
          </Avatar>
          <div className="font-medium whitespace-nowrap">
            {internalTitles.length > 0 && (
              <span className="text-gold">
                {internalTitles.map((t) => t.title.shortTitle).join(" ")}
              </span>
            )}{" "}
            {nickname || name}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {defendingChampions?.map((championship) => (
            <div key={championship.championship.name}>
              {formatDefendingChampions(championship.championship.name, 16)}
            </div>
          ))}
        </div>
      </div>

      {open && <PlayerModal id={id} open={open} setOpen={setOpen} />}
    </>
  );
};
