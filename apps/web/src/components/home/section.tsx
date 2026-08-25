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
    <section className={cn(main ? "pt-8 pb-10 md:pb-12" : "py-10 md:py-12", className)}>
      <div className="relative">
        {!main && (
          <Announcement
            icon={icon}
            label={label}
            stacked
            className="text-xl md:text-2xl font-display text-foreground"
          />
        )}
        {children}
      </div>
    </section>
  )
}
