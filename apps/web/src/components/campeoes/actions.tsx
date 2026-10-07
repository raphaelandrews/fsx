import { useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@fsx/ui/components/avatar"
import { Button } from "@fsx/ui/components/button"

import { PlayerSheetById } from "@/components/sheets/player/player-sheet-by-id"
import { avatarGradient } from "@/components/avatar-gradient"

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
          className="group flex h-auto items-center gap-3 rounded-md p-0 text-sm hover:bg-transparent dark:hover:bg-transparent aria-expanded:bg-transparent"
          variant="ghost"
        >
          <Avatar className="size-8">
            <AvatarImage alt={name} src={image ?? undefined} />
            <AvatarFallback className={avatarGradient(id)} />
          </Avatar>
          <span className="font-semibold whitespace-nowrap underline-reveal underline-reveal-primary group-hover:after:left-0 group-hover:after:w-full group-focus-visible:after:left-0 group-focus-visible:after:w-full">
            {shortTitle && <span className="text-warning">{shortTitle}</span>}{" "}
            {nickname ?? name}
          </span>
        </Button>
      }
    />
  )
}
