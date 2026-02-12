import { type LucideIcon } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { DottedSeparator } from "@/components/dotted-separator";
import { DottedX } from "@/components/dotted-x";

interface Props {
  label?: string;
  icon: LucideIcon;
}

export function Announcement({ label, icon: Icon }: Props) {
  const baseStyles = "inline-flex items-center text-base font-bold";
  const iconStyles = "size-4";

  if (label) {
    return (
      <>
        <DottedX>
          <div className={baseStyles}>
            <Icon className={iconStyles} />
            <Separator className="!w-0.5 !h-4 mx-2" orientation="vertical" />
            {label}
          </div>
        </DottedX>
        <DottedSeparator />
      </>
    );
  }

  return (
    <>
      <DottedX>
        <div className="inline-block rounded-md bg-primary-foreground p-2.5 text-muted-foreground">
          <Icon className="size-4" />
        </div>
      </DottedX>
      <DottedSeparator />
    </>
  );
}
