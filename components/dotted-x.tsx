import { cn } from "@/lib/utils"

export function DottedX({
  children,
  className,
}: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "max-w-[720px] mx-2 sm:mx-8 md:mx-auto relative p-3 dotted-border-x",
        className,
      )}
    >
      {children}
    </div>
  )
}