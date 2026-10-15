import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@fsx/ui/lib/utils";
import { Separator } from "@fsx/ui/components/separator";

import type { IconSvgObject } from "@/lib/icon-types";

export function SectionHeading({
  label,
  icon,
  className,
}: {
  label: string;
  icon?: IconSvgObject;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center p-3 font-bold text-base text-title", className)}>
      {icon && <HugeiconsIcon icon={icon} className="size-[1em]" />}
      {icon && <Separator className="!w-0.5 !h-[1em] mx-[0.5em] mt-0.75" orientation="vertical" />}
      <span>{label}</span>
    </div>
  );
}
