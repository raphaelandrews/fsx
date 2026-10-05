import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";

import { Avatar, AvatarFallback, AvatarImage } from "@fsx/ui/components/avatar";
import { Button } from "@fsx/ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@fsx/ui/components/popover";

import { PlayerSheetById } from "@/components/sheets/player/player-sheet-by-id";
import { avatarGradient } from "@/components/avatar-gradient";
import { championshipIcon } from "@/components/gamification/championship-icons";

interface Props {
  id: number;
  name: string;
  nickname?: string | null;
  image?: string | null;
  shortName?: string | null;
  defendingChampions?:
  | {
    championshipId: number;
    championship: {
      name: string;
    };
  }[]
  | null;
}

export const Actions = ({ id, name, nickname, image, shortName, defendingChampions }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <PlayerSheetById
        id={id}
        open={open}
        setOpen={setOpen}
        trigger={
          <Button
            aria-label={`Ver perfil de ${name}`}
            className="flex h-auto items-center gap-3 rounded-md p-0 hover:bg-transparent hover:underline dark:hover:bg-transparent aria-expanded:bg-transparent"
            variant="ghost"
          >
            <Avatar className="size-8 rounded-md">
              <AvatarImage alt={name} src={image ?? undefined} />
              <AvatarFallback className={avatarGradient(id)} />
            </Avatar>
            <div className="whitespace-nowrap font-medium">
              {shortName && <span className="text-highlight">{shortName}</span>} {nickname ?? name}
            </div>
          </Button>
        }
      />

      {defendingChampions && (
        <div className="flex items-center gap-2">
          {defendingChampions.map(({ championshipId, championship }) => (
            <Popover key={championshipId}>
              <PopoverTrigger
                aria-label={`Atual campeão(ã) · ${championship.name}`}
                className="rounded-md bg-muted p-2 text-foreground"
              >
                <HugeiconsIcon icon={championshipIcon(championshipId)} className="size-4" aria-hidden />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 text-xs font-medium">Atual campeão(ã) · {championship.name}</PopoverContent>
            </Popover>
          ))}
        </div>
      )}
    </div>
  );
};
