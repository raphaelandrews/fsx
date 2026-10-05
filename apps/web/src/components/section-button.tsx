import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { buttonVariants } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

interface SectionButtonProps {
  href: string;
  target?: string;
  label: string;
  className?: string;
}

export function SectionButton({ href, target, label, className }: SectionButtonProps) {
  return (
    <div className="mt-8 flex select-none items-center justify-center px-3 sm:px-0">
      <Link
        to={href}
        target={target}
        className={cn(buttonVariants({ size: "pill" }), "w-full active:scale-[0.96] sm:w-fit", className)}
      >
        {label}
        <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" strokeWidth={2} aria-hidden />
      </Link>
    </div>
  );
}
