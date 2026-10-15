import type { Movement as MovementValue } from "@fsx/api/gamification/ranking";
import { cn } from "@fsx/ui/lib/utils";

const plural = (count: number) => `${count} posiç${count === 1 ? "ão" : "ões"}`;

export function Movement({ value, className }: { value: MovementValue; className?: string }) {
  if (value === null || value === 0) return null;
  if (value === "new") {
    return <span className={cn("text-muted-foreground text-[11px]", className)}>novo</span>;
  }
  const up = value > 0;
  return (
    <span
      className={cn(
        "text-[11px] font-medium tabular-nums",
        up ? "text-success" : "text-destructive",
        className,
      )}
    >
      <span aria-hidden>
        {up ? "▲" : "▼"}
        {Math.abs(value)}
      </span>
      <span className="sr-only">{up ? `subiu ${plural(value)}` : `caiu ${plural(-value)}`} na última atualização</span>
    </span>
  );
}
