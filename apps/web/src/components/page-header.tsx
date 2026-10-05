import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@fsx/ui/lib/utils";

import type { IconSvgObject } from "@/lib/icon-types";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: IconSvgObject;
  className?: string;
}

// Same icon treatment as the home section headers: a 44px neutral circle above the title.
export function PageHeader({ title, description, icon, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col items-center pt-8 pb-6 text-center sm:pt-12 sm:pb-8", className)}>
      {icon ? (
        <span className="mb-4 inline-flex size-11 animate-rise items-center justify-center rounded-full bg-muted text-foreground" aria-hidden>
          <HugeiconsIcon icon={icon} className="size-5" strokeWidth={1.75} />
        </span>
      ) : null}
      <h1 className="animate-rise text-balance text-3xl font-semibold tracking-tight [--rise-delay:60ms] sm:text-4xl">{title}</h1>
      {description ? (
        <p className="mx-auto mt-3 max-w-2xl animate-rise text-base text-pretty text-muted-foreground [--rise-delay:120ms]">{description}</p>
      ) : null}
    </div>
  );
}
