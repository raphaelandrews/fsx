
import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  TrainIcon,
  ZapIcon,
  CrownIcon,
} from "@hugeicons/core-free-icons"

import { Avatar, AvatarFallback, AvatarImage } from "@fsx/ui/components/avatar"
import { Button } from "@fsx/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@fsx/ui/components/popover"

import { PlayerSheetById } from "@/components/sheets/player/player-sheet-by-id"

const meshGradients = [
  {
    backgroundColor: "#ff99e2",
    backgroundImage: `radial-gradient(at 73% 56%, hsla(313,90%,63%,1) 0px, transparent 50%), radial-gradient(at 68% 18%, hsla(222,78%,69%,1) 0px, transparent 50%), radial-gradient(at 33% 10%, hsla(350,80%,61%,1) 0px, transparent 50%), radial-gradient(at 89% 46%, hsla(149,69%,65%,1) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "#99f7ff",
    backgroundImage: `radial-gradient(at 92% 82%, hsla(307,83%,78%,1) 0px, transparent 50%), radial-gradient(at 68% 56%, hsla(177,93%,63%,1) 0px, transparent 50%), radial-gradient(at 10% 31%, hsla(118,81%,62%,1) 0px, transparent 50%), radial-gradient(at 94% 59%, hsla(150,87%,60%,1) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "#99e2ff",
    backgroundImage: `radial-gradient(at 93% 87%, hsla(347,88%,66%,1) 0px, transparent 50%), radial-gradient(at 83% 42%, hsla(204,66%,69%,1) 0px, transparent 50%), radial-gradient(at 93% 58%, hsla(5,99%,73%,1) 0px, transparent 50%), radial-gradient(at 43% 99%, hsla(6,71%,67%,1) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "#c599ff",
    backgroundImage: `radial-gradient(at 22% 54%, hsla(279,86%,60%,1) 0px, transparent 50%), radial-gradient(at 8% 6%, hsla(0,83%,76%,1) 0px, transparent 50%), radial-gradient(at 61% 68%, hsla(265,60%,78%,1) 0px, transparent 50%), radial-gradient(at 53% 33%, hsla(189,97%,61%,1) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "#99adff",
    backgroundImage: `radial-gradient(at 98% 14%, hsla(232,98%,60%,1) 0px, transparent 50%), radial-gradient(at 8% 18%, hsla(219,98%,66%,1) 0px, transparent 50%), radial-gradient(at 97% 60%, hsla(146,72%,60%,1) 0px, transparent 50%), radial-gradient(at 8% 48%, hsla(46,75%,70%,1) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "#ff6b6b",
    backgroundImage: `radial-gradient(at 10% 20%, hsla(0, 100%, 65%, 1) 0px, transparent 50%), radial-gradient(at 80% 30%, hsla(10, 90%, 55%, 1) 0px, transparent 50%), radial-gradient(at 40% 70%, hsla(20, 80%, 60%, 1) 0px, transparent 50%), radial-gradient(at 90% 10%, hsla(30, 70%, 50%, 1) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "#f59e0b",
    backgroundImage: `radial-gradient(at 20% 80%, hsla(36, 100%, 70%, 1) 0px, transparent 50%), radial-gradient(at 90% 20%, hsla(40, 95%, 60%, 1) 0px, transparent 50%), radial-gradient(at 60% 50%, hsla(30, 100%, 65%, 1) 0px, transparent 50%), radial-gradient(at 10% 30%, hsla(45, 80%, 55%, 1) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "#10b981",
    backgroundImage: `radial-gradient(at 30% 10%, hsla(142, 80%, 50%, 1) 0px, transparent 50%), radial-gradient(at 70% 20%, hsla(150, 90%, 55%, 1) 0px, transparent 50%), radial-gradient(at 10% 60%, hsla(130, 70%, 45%, 1) 0px, transparent 50%), radial-gradient(at 80% 90%, hsla(160, 60%, 50%, 1) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "#3b82f6",
    backgroundImage: `radial-gradient(at 10% 90%, hsla(210, 90%, 50%, 1) 0px, transparent 50%), radial-gradient(at 20% 20%, hsla(220, 100%, 55%, 1) 0px, transparent 50%), radial-gradient(at 60% 30%, hsla(200, 80%, 45%, 1) 0px, transparent 50%), radial-gradient(at 90% 80%, hsla(230, 70%, 50%, 1) 0px, transparent 50%)`,
  },
  {
    backgroundColor: "#8b5cf6",
    backgroundImage: `radial-gradient(at 80% 10%, hsla(265, 80%, 60%, 1) 0px, transparent 50%), radial-gradient(at 20% 30%, hsla(275, 90%, 55%, 1) 0px, transparent 50%), radial-gradient(at 50% 70%, hsla(255, 70%, 50%, 1) 0px, transparent 50%), radial-gradient(at 10% 40%, hsla(285, 60%, 65%, 1) 0px, transparent 50%)`,
  },
]

function getGradient(id: number) {
  const index = Math.abs(id) % meshGradients.length
  return meshGradients[index]
}

function formatDefendingChampions(championship: string) {
  const cmp = championship
  if (cmp === "Absoluto") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={TrainIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Absoluto</PopoverContent>
      </Popover>
    )
  }
  if (cmp === "Rápido") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={TrainIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Rápido</PopoverContent>
      </Popover>
    )
  }
  if (cmp === "Blitz") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={ZapIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Blitz</PopoverContent>
      </Popover>
    )
  }
  if (cmp === "Feminino") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={CrownIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeã Sergipana Feminino</PopoverContent>
      </Popover>
    )
  }
  if (cmp === "Equipes") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={ZapIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Equipes</PopoverContent>
      </Popover>
    )
  }
  return null
}


interface Props {
  id: number
  name: string
  nickname?: string | null
  image?: string | null
  shortName?: string | null
  defendingChampions?:
  | {
    championship: {
      name: string
    }
  }[]
  | null
}

export const Actions = ({
  id,
  name,
  nickname,
  image,
  shortName,
  defendingChampions,
}: Props) => {
  const [open, setOpen] = useState(false)
  const gradient = getGradient(id)

  return (
    <div className="flex items-center gap-3">
      <PlayerSheetById
        id={id}
        open={open}
        setOpen={setOpen}
        trigger={
          <Button
            aria-label={`Ver perfil de ${name}`}
            className="flex h-auto items-center gap-3 rounded-md p-0 hover:bg-transparent hover:text-primary dark:hover:bg-transparent aria-expanded:bg-transparent"
            variant="ghost"
          >
            <Avatar className="size-8 rounded-md">
              <AvatarImage alt={name} src={image ?? undefined} />
              <AvatarFallback style={gradient} />
            </Avatar>
            <div className="whitespace-nowrap font-medium">
              {shortName && <span className="text-highlight">{shortName}</span>}{" "}
              {nickname ?? name}
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
  )
}
