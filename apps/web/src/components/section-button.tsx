import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@fsx/ui/lib/utils";

interface SectionButtonProps {
  href: string;
  target?: string;
  label: string;
  className?: string;
}

export function SectionButton({ href, target, label, className }: SectionButtonProps) {
  return (
    <div className="flex select-none items-center justify-center mt-8">
      <Link
        to={href}
        target={target}
        className={cn(
          "group w-fit rounded-[10px] border border-border p-[2px] hover:bg-transparent flex select-none items-center justify-center",
          className,
        )}
      >
        <div className="flex h-full w-full items-center justify-center gap-1 rounded-[8px] border border-border bg-secondary px-2.5 py-1 text-secondary-foreground transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
          <span className="text-[0.95rem] font-medium">{label}</span>
          <span className="flex items-center transition-transform duration-300 group-hover:scale-125">
            <HugeiconsIcon className="size-4" icon={ArrowUpRight01Icon} />
          </span>
        </div>
      </Link>
    </div>
  );
}
