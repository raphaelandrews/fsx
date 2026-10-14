import { HugeiconsIcon } from "@hugeicons/react";

import { Popover, PopoverContent, PopoverTrigger } from "@fsx/ui/components/popover";

import { championshipIcon } from "@/components/gamification/championship-icons";
import { PlayerSheetButton } from "@/components/player/player-sheet-button";

interface Props {
  id: number;
  name: string;
  nickname?: string | null;
  image?: string | null;
  shortName?: string | null;
  defendingChampions?: { championshipId: number; championship: { name: string } }[] | null;
}

export function Actions({ id, name, nickname, image, shortName, defendingChampions }: Props) {
  return (
    <div className="flex items-center gap-3">
      <PlayerSheetButton id={id} name={name} nickname={nickname} image={image} shortTitle={shortName} />

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
              <PopoverContent className="w-auto p-2 text-sm font-medium">Atual campeão(ã) · {championship.name}</PopoverContent>
            </Popover>
          ))}
        </div>
      )}
    </div>
  );
}
