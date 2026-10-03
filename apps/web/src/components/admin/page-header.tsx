import type { ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

import { Separator } from "@fsx/ui/components/separator";
import { cn } from "@fsx/ui/lib/utils";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned actions, e.g. a "New" link or a delete button. */
  actions?: ReactNode;
  /** Parent page, shown as a back link above the title on create and edit pages. */
  backTo?: LinkProps["to"];
  backLabel?: string;
  className?: string;
}

export function AdminPageHeader({
  title,
  description,
  actions,
  backTo,
  backLabel,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      {backTo ? (
        <Link
          to={backTo}
          className="mb-3 inline-flex items-center gap-1 rounded-sm text-muted-foreground text-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
        >
          <HugeiconsIcon className="size-4" icon={ArrowLeft01Icon} strokeWidth={2} />
          {backLabel ?? "Back"}
        </Link>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-semibold text-xl tracking-tight sm:text-2xl">{title}</h1>
          {description ? <p className="mt-1 text-muted-foreground text-sm">{description}</p> : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      <Separator className="mt-4" />
    </div>
  );
}
