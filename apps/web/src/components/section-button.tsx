
import { Link } from "@tanstack/react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons"
import { buttonVariants } from "@fsx/ui/components/button"
import { cn } from "@fsx/ui/lib/utils"

interface SectionButtonProps {
  href: string
  target?: string
  label: string
  className?: string
}

export function SectionButton({
  href,
  target,
  label,
  className,
}: SectionButtonProps) {
  return (
    <div className="flex justify-center items-center mt-8">
      <a
        href={href}
        target={target}
        className={buttonVariants({ variant: "default", size: "lg" })}
      >
        {label}
      </a>
    </div>
  )
}
