import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { InformationCircleIcon } from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@fsx/ui/components/popover";

/** A small "how does this work" button that opens the explanation, so it does not sit on the page as a footnote. */
export function InfoPopover({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger render={<Button variant="ghost" size="lg" />}>
        <HugeiconsIcon icon={InformationCircleIcon} data-icon="inline-start" aria-hidden />
        {label}
      </PopoverTrigger>
      <PopoverContent className="w-[min(24rem,calc(100vw-2rem))] gap-2 p-4 text-sm">
        <p className="font-semibold text-base">{title}</p>
        {children}
      </PopoverContent>
    </Popover>
  );
}
