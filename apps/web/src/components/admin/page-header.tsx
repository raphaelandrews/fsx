import type { ReactNode } from "react";

import { Separator } from "@fsx/ui/components/separator";
import { cn } from "@fsx/ui/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned actions, e.g. a "Create" link/button. */
  actions?: ReactNode;
  className?: string;
}

export function AdminPageHeader({ title, description, actions, className }: AdminPageHeaderProps) {
  return (
    <div className={cn("mb-5", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-semibold text-xl tracking-tight sm:text-2xl">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      <Separator className="my-4" />
    </div>
  );
}
