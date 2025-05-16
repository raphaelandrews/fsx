import { useState, useMemo } from "react";

import { getGradient } from "@/lib/generate-gradients";

import PlayerModal from "@/components/modals/player-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  id: number;
  name: string;
  nickname?: string | null;
  image?: string | null;
  shortTitle?: string | null;
}

export const Actions = ({ id, name, nickname, image, shortTitle }: Props) => {
  const [open, setOpen] = useState(false);
  const gradient = useMemo(() => getGradient(id), [id]);

  const handleKeyboardEvent = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      setOpen(true);
    }
  };

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        onKeyUp={handleKeyboardEvent}
        onKeyDown={handleKeyboardEvent}
        className="flex items-center gap-3 cursor-pointer"
      >
        <Avatar className="w-8 h-8 rounded-md">
          <AvatarImage src={image || ""} alt={name} />
          <AvatarFallback style={gradient} />
        </Avatar>
        <div className="font-medium whitespace-nowrap">
          <span className="text-gold">{shortTitle}</span> {nickname || name}
        </div>
      </div>

      {open && <PlayerModal id={id} open={open} setOpen={setOpen} />}
    </>
  );
};
