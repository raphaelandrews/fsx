import { Link, useLocation, type LinkProps } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, File01Icon } from "@hugeicons/core-free-icons";

import { buttonVariants } from "@fsx/ui/components/button";

import { findActiveNav } from "@/components/header/admin-nav-data";

export function EmptyCollection({ noun, createTo }: { noun: string; createTo: LinkProps["to"] }) {
  const { pathname } = useLocation();
  const icon = findActiveNav(pathname).item?.icon ?? File01Icon;

  return (
    <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
      <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-muted text-title">
        <HugeiconsIcon className="size-7" icon={icon} strokeWidth={1.75} />
      </span>
      <h2 className="font-semibold text-xl tracking-tight">No {noun} yet</h2>
      <p className="max-w-sm text-muted-foreground text-base">
        Create the first one and it will show up here.
      </p>
      <Link to={createTo} className={buttonVariants({ size: "xl", className: "mt-4" })}>
        <HugeiconsIcon className="size-5" icon={Add01Icon} strokeWidth={2} />
        Create
      </Link>
    </div>
  );
}
