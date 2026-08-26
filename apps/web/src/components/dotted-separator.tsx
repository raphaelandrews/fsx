import { cn } from "@fsx/ui/lib/utils";

export function DottedSeparator({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "h-px w-full bg-[image:repeating-linear-gradient(to_right,var(--border)_0px,var(--border)_6px,transparent_6px,transparent_14px)] bg-[size:100%_1px] bg-no-repeat",
        className,
      )}
    />
  );
}
