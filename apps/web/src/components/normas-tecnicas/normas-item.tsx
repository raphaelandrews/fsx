import { HugeiconsIcon } from "@hugeicons/react";
import { Book01Icon } from "@hugeicons/core-free-icons";

import { DottedSeparator } from "@/components/dotted-separator";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@fsx/ui/components/accordion";

interface NormasItemProps {
  value: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  isLast: boolean;
}

export function NormasItem({ value, title, description, children, isLast }: NormasItemProps) {
  return (
    <AccordionItem value={value} className="border-b-0">
      <div className="m-1">
        <AccordionTrigger className="group cursor-pointer items-center rounded-none p-3 text-left transition-all duration-300 select-none hover:bg-muted/50 hover:no-underline">
          <div className="flex w-full flex-col gap-2 text-left">
            <div className="flex items-center gap-2">
              <HugeiconsIcon className="size-3.5 text-muted-foreground" icon={Book01Icon} />
              <h3 className="text-sm leading-tight font-bold">{title}</h3>
            </div>
            {description ? (
              <p className="line-clamp-2 text-xs font-normal text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-0">
          <div className="text-sm text-foreground">{children}</div>
        </AccordionContent>
      </div>
      {!isLast && <DottedSeparator className="w-full" />}
    </AccordionItem>
  );
}
