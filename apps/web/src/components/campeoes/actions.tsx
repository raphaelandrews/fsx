import { useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@fsx/ui/components/avatar"
import { Button } from "@fsx/ui/components/button"

import { PlayerSheetById } from "@/components/sheets/player/player-sheet-by-id"
import { getInitials } from "@/lib/initials"

interface Props {
  id: number
  name: string
  nickname?: string | null
  image?: string | null
  shortTitle?: string | null
}

export const PlayerActions = ({ id, name, nickname, image, shortTitle }: Props) => {
  const [open, setOpen] = useState(false)

  return (
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
          <div className="font-medium whitespace-nowrap">
            {shortTitle && <span className="text-highlight">{shortTitle}</span>}{" "}
            {nickname ?? name}
          </div>
        </Button>
      }
    />
  )
}
