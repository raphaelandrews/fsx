import React from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@fsx/ui/components/avatar"
import { Button } from "@fsx/ui/components/button"

import { PlayerSheetById } from "@/components/sheets/player/player-sheet-by-id"
import { getGradient } from "@/lib/gradients"

interface Props {
  id: number
  name: string
  nickname?: string | null
  image?: string | null
  shortTitle?: string | null
}

export const PlayerActions = ({ id, name, nickname, image, shortTitle }: Props) => {
  const [open, setOpen] = React.useState(false)
  const gradient = getGradient(id)

  const handleKeyboardEvent = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      setOpen(true)
    }
  }

  return (
    <>
      <Button
        aria-label={`Ver perfil de ${name}`}
        className="flex cursor-pointer items-center gap-3"
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyboardEvent}
        onKeyUp={handleKeyboardEvent}
        variant="link"
      >
        <Avatar className="size-8 rounded-md">
          <AvatarImage alt={name} src={image ?? undefined} />
          <AvatarFallback style={gradient} />
        </Avatar>
        <div className="font-medium whitespace-nowrap">
          {shortTitle && <span className="text-highlight">{shortTitle}</span>}{" "}
          {nickname ?? name}
        </div>
      </Button>

      {open && <PlayerSheetById id={id} open={open} setOpen={setOpen} />}
    </>
  )
}
