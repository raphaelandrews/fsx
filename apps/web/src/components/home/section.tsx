import { cn } from "@fsx/ui/lib/utils"

import type { IconSvgObject } from "@/lib/icon-types"

import { Announcement } from "@/components/announcement"

interface Props {
  label?: string
  className?: string
  icon?: IconSvgObject
  main: boolean
  children: React.ReactNode
}

export function Section({
  label,
  className,
  icon,
  main,
  children,
}: Props) {
  return (
    <section className={cn(className)}>
      <div className="mx-2 sm:mx-8 md:mx-auto relative p-0">
        {!main && <Announcement icon={icon} label={label} />}
        {children}
      </div>
    </section>
  )
}
