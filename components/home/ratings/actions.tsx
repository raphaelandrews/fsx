"use client"

import React from "react"

import { formatDefendingChampions } from "@/lib/defending-champions"
import { getGradient } from "@/lib/generate-gradients"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

import { PlayerSheet } from "@/components/sheets/player/player-sheet"

interface Props {
  id: number
  name: string
  nickname?: string | null
  image?: string | null
  shortTitle?: string | null
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
  shortTitle,
  defendingChampions,
}: Props) => {
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
      <div className="group flex items-center gap-3">
        <Button
          aria-label={`View ${name}'s profile`}
          className="flex cursor-pointer items-center gap-3 rounded-md transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          onClick={() => setOpen(true)}
          onKeyDown={handleKeyboardEvent}
          onKeyUp={handleKeyboardEvent}
          variant="link"
        >
          <Avatar className="size-8 rounded-md">
            <AvatarImage alt={name} src={image ?? undefined} />
            <AvatarFallback style={gradient} />
          </Avatar>
          <div className="whitespace-nowrap font-medium">
            {shortTitle && <span className="text-highlight">{shortTitle}</span>}{" "}
            {nickname ?? name}
          </div>
        </Button>

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

      <PlayerSheet id={id} open={open} setOpen={setOpen} />
    </>
  );
}
