import { useId } from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@fsx/ui/lib/utils"

import type { IconSvgObject } from "@/lib/icon-types"

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
  const headingId = useId()
  const hasHeader = !main && label

  return (
    <section
      aria-labelledby={hasHeader ? headingId : undefined}
      className={cn(main ? "pt-8 pb-10 md:pb-12" : "py-10 md:py-12", className)}
    >
      <div className="relative">
        {hasHeader && (
          <header className="mb-8 flex flex-col items-center gap-3 px-3 text-center">
            {icon && (
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-muted text-foreground" aria-hidden>
                <HugeiconsIcon icon={icon} className="size-5" strokeWidth={1.75} />
              </span>
            )}
            <h2 id={headingId} className="text-balance font-semibold text-2xl tracking-tight sm:text-3xl">
              {label}
            </h2>
          </header>
        )}
        {children}
      </div>
    </section>
  )
}
