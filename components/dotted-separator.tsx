import { cn } from "@/lib/utils"

export function DottedSeparator({
  vertical,
  className,
}: { vertical?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        vertical
          ? "w-px h-full dotted-line-vertical"
          : "w-full h-px dotted-line-horizontal",
        className,
      )}
    />
  )
}
