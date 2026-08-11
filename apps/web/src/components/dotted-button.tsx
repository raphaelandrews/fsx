
import { Link } from "@tanstack/react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons"
import { DottedX } from "./dotted-x"
import { DottedSeparator } from "./dotted-separator"
import { Button } from "@fsx/ui/components/button"
import { cn } from "@fsx/ui/lib/utils"

interface DottedButtonProps {
  href: string
  target?: string
  label: string
  className?: string
}

export function DottedButton({
  href,
  target,
  label,
  className,
}: DottedButtonProps) {
  return (
    <div className="w-full">
      <DottedSeparator />
      <DottedX className="p-2 relative">
        <div className="flex items-center justify-center select-none">
          <Button
            variant="ghost"
            className={cn(
              "w-fit p-[2px] h-fit rounded-[10px] border border-border group hover:bg-transparent",
              className
            )}
          >
            <Link to={href} target={target}>
              <div className="flex gap-1 items-center justify-center rounded-[8px] border border-border w-full h-full px-2.5 py-1 bg-secondary group-hover:bg-primary transition-colors duration-300 text-secondary-foreground group-hover:text-primary-foreground">
                <span className="text-[0.95rem] font-medium">{label}</span>
                <span className="flex items-center group-hover:scale-125 transition-transform duration-300">
                  <HugeiconsIcon className="size-4" icon={ArrowUpRight01Icon} />
                </span>
              </div>
            </Link>
          </Button>
        </div>
      </DottedX>
    </div>
  )
}
