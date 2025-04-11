import { useMemo, useState } from "react";

import { formatDefendingChampions } from "@/utils/defending-champions";
import { getGradient } from "@/utils/generate-gradients";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import type { Player } from "@/schemas/players"; 

interface Props
  extends Pick<Player, "id" | "name" | "nickname" | "imageUrl"> {
  shortTitle?: string | null;
  defendingChampions?: Player["defendingChampions"];
}

export const Actions = ({
  id,
  name,
  nickname,
  imageUrl,
  shortTitle,
  defendingChampions,
}: Props) => {
  const [open, setOpen] = useState(false);
  const gradient = useMemo(() => getGradient(id.toString()), [id]);

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
          className="flex items-center gap-3 cursor-pointer"
        >
          <Avatar className="w-8 h-8 rounded-md">
            <AvatarImage src={imageUrl || ""} alt={name} />
            <AvatarFallback style={gradient} />
          </Avatar>
          <div className="font-medium whitespace-nowrap">
            {shortTitle && <span className="text-gold">{shortTitle}</span>}{" "}
            {nickname || name}
          </div>
        </div>
        {defendingChampions?.map((championship) => (
          <div key={championship.championship.name}>
            {formatDefendingChampions(championship.championship.name, 16)}
          </div>
        ))}
      </div>
    </>
  );
};
