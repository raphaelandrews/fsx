import {
  CrownIcon,
  RabbitIcon,
  SwordsIcon,
  TurtleIcon,
  ZapIcon,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const formatDefendingChampions = (championship: string, size: number) => {
  if (championship === "Absoluto") {
    return (
      <Popover>
        <PopoverTrigger className="text-accent-foreground p-2 bg-accent rounded-md">
          <TurtleIcon width={size} height={size} />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Absoluto</PopoverContent>
      </Popover>
    );
  }

  if (championship === "Rápido") {
    return (
      <Popover>
        <PopoverTrigger className="text-accent-foreground p-2 bg-accent rounded-md">
          <RabbitIcon width={size} height={size} />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Rápido</PopoverContent>
      </Popover>
    );
  }

  if (championship === "Blitz") {
    return (
      <Popover>
        <PopoverTrigger className="text-accent-foreground p-2 bg-accent rounded-md">
          <ZapIcon width={size} height={size} />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Blitz</PopoverContent>
      </Popover>
    );
  }

  if (championship === "Feminino") {
    return (
      <Popover>
        <PopoverTrigger className="text-accent-foreground p-2 bg-accent rounded-md">
          <CrownIcon width={size} height={size} />
        </PopoverTrigger>
        <PopoverContent>Atual campeã Sergipana Feminino</PopoverContent>
      </Popover>
    );
  }

  if (championship === "Equipes") {
    return (
      <Popover>
        <PopoverTrigger className="text-accent-foreground p-2 bg-accent rounded-md">
          <SwordsIcon width={size} height={size} />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Equipes</PopoverContent>
      </Popover>
    );
  }
};
