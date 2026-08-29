import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { TrainIcon, ZapIcon, CrownIcon } from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@fsx/ui/components/avatar";
import { Button } from "@fsx/ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@fsx/ui/components/popover";

import { PlayerSheetById } from "@/components/sheets/player/player-sheet-by-id";
import { getInitials } from "@/lib/initials";

function formatDefendingChampions(championship: string) {
  const cmp = championship;
  if (cmp === "Absoluto") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={TrainIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Absoluto</PopoverContent>
      </Popover>
    );
  }
  if (cmp === "Rápido") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={TrainIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Rápido</PopoverContent>
      </Popover>
    );
  }
  if (cmp === "Blitz") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={ZapIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Blitz</PopoverContent>
      </Popover>
    );
  }
  if (cmp === "Feminino") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={CrownIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeã Sergipana Feminino</PopoverContent>
      </Popover>
    );
  }
  if (cmp === "Equipes") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={ZapIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Equipes</PopoverContent>
      </Popover>
    );
  }
  return null;
}

interface Props {
  id: number;
  name: string;
  nickname?: string | null;
  image?: string | null;
  shortName?: string | null;
  defendingChampions?:
  | {
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
              <AvatarFallback>
                <span className="text-xs uppercase text-foreground">
                  {getInitials(nickname ?? name)}
                </span>
              </AvatarFallback>
            </Avatar>
            <div className="whitespace-nowrap font-medium">
              {shortName && <span className="text-highlight">{shortName}</span>} {nickname ?? name}
            </div>
          </Button>
        }
      />

      {defendingChampions && (
        <div className="flex items-center gap-2">
          {defendingChampions.map((championship) => (
            <div key={championship.championship.name}>
              {formatDefendingChampions(championship.championship.name)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
