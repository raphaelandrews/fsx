import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, CheckmarkCircle02Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";

import { cn } from "@fsx/ui/lib/utils";

const TONES = {
  error: { icon: Alert02Icon, className: "border-destructive/30 bg-destructive/10 text-destructive", role: "alert" },
  warning: { icon: Alert02Icon, className: "border-warning-foreground/25 bg-warning text-warning-foreground", role: "status" },
  success: { icon: CheckmarkCircle02Icon, className: "border-success/30 bg-success/10 text-success", role: "status" },
  info: { icon: InformationCircleIcon, className: "border-border bg-muted text-foreground", role: "status" },
} as const;

export type AlertTone = keyof typeof TONES;

export function InlineAlert({
  tone,
  title,
  children,
  className,
}: {
  tone: AlertTone;
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  const { icon, className: toneClass, role } = TONES[tone];
  return (
    <div
      role={role}
      className={cn("fade-in-0 slide-in-from-top-1 flex animate-in gap-3 rounded-lg border p-3 text-sm duration-200", toneClass, className)}
    >
      <HugeiconsIcon icon={icon} className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className="font-semibold">{title}</p>
        {children ? <div className="text-pretty">{children}</div> : null}
      </div>
    </div>
  );
}
