import type { ReactNode } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";

import { buttonVariants } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

import { HEADER_SLOT_ID } from "@/components/admin/admin-slots";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned actions, e.g. a "New" link. */
  actions?: ReactNode;
  /** Parent page. A page with one is a create or edit page: a back button leads the title. */
  backTo?: LinkProps["to"];
  backLabel?: string;
  /** Status next to the title, e.g. a published badge. */
  badge?: ReactNode;
  className?: string;
}

export function AdminPageHeader({ title, description, actions, backTo, backLabel, badge, className }: AdminPageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {backTo ? (
            <Link
              to={backTo}
              aria-label={`Back to ${backLabel ?? "the list"}`}
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            >
              <HugeiconsIcon className="size-5" icon={ArrowLeft01Icon} strokeWidth={2} />
            </Link>
          ) : null}
          <h1 className={cn("truncate tracking-tight", backTo ? "font-semibold text-2xl @md:text-3xl" : "font-bold text-xl sm:text-2xl")}>{title}</h1>
          {badge}
        </div>
        <div className="flex max-w-full shrink-0 flex-wrap items-center gap-3">
          {actions}
          {backTo ? <div id={HEADER_SLOT_ID} className="contents" /> : null}
        </div>
      </div>
      {description ? <p className="mt-2 text-muted-foreground text-sm">{description}</p> : null}
    </div>
  );
}
