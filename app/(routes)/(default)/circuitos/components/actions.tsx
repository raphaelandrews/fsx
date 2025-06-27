import { useState, useMemo } from "react";

import { getGradient } from "@/lib/generate-gradients";

import { PlayerSheet } from "@/components/sheets/player/player-sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Props {
  id: number;
  name: string;
  nickname?: string | null;
  imageUrl?: string | null;
  shortTitle?: string | null;
}

export const Actions = ({
  id,
  name,
  nickname,
  imageUrl,
  shortTitle,
}: Props) => {
  const [open, setOpen] = useState(false);
  const gradient = useMemo(() => getGradient(id), [id]);

  const handleKeyboardEvent = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      setOpen(true);
    }
  };

  return (
    <>
      <Button
        variant="link"
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
          <span className="text-gold">{shortTitle}</span> {nickname || name}
        </div>
      </Button>

      {open && <PlayerSheet id={id} open={open} setOpen={setOpen} />}
    </>
  );
};
