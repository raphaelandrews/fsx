import { cn } from "@/lib/utils"

export function DottedSeparator({
  vertical,
  className,
  fullWidth = false,
}: { vertical?: boolean; className?: string; fullWidth?: boolean }) {
  const separator = (
    <div
      className={cn(
        vertical
          ? "w-px h-full dotted-line-vertical"
          : "w-full h-px dotted-line-horizontal",
        className,
      )}
    />
  )

  if (fullWidth && !vertical) {
    return (
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        {separator}
      </div>
    )
  }

  return separator
}
