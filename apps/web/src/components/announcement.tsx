import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@fsx/ui/lib/utils"

import type { IconSvgObject } from "@/lib/icon-types"

import { Separator } from "@fsx/ui/components/separator"

interface Props {
  label?: string
  icon?: IconSvgObject
  className?: string
  stacked?: boolean
}

export function Announcement({ label, icon: Icon, className, stacked = false }: Props) {
  const baseStyles = cn(
    "flex items-center text-base font-bold p-3",
    stacked && "flex-col gap-2 px-0 pt-0 pb-6 text-center",
    className
  )
  const iconStyles = stacked ? "size-8" : "size-[1em]"

  if (label) {
    return (
      <div className={baseStyles}>
        {Icon && <HugeiconsIcon icon={Icon} className={iconStyles} />}
        {!stacked && Icon && <Separator className="!w-0.5 !h-[1em] mx-[0.5em]" orientation="vertical" />}
        <span>{label}</span>
      </div>
    )
  }

  return (
    <div className="p-3">
      <div className="inline-block rounded-md bg-primary-foreground p-2.5 text-muted-foreground">
        {Icon && <HugeiconsIcon icon={Icon} className="size-4" />}
      </div>
    </div>
  )
}
