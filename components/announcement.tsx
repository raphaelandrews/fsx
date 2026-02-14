import { type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Separator } from "@/components/ui/separator";
import { DottedSeparator } from "@/components/dotted-separator";

interface Props {
  label?: string;
  icon?: LucideIcon;
  className?: string;
  fullWidth?: boolean;
  topSeparator?: boolean;
  bottomSeparator?: boolean;
}

export function Announcement({ label, icon: Icon, className, fullWidth = true, topSeparator = false, bottomSeparator = true }: Props) {
  const baseStyles = cn("flex items-center text-base font-bold p-3", className);
  const iconStyles = "size-4";

  const separator = fullWidth ? (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <DottedSeparator />
    </div>
  ) : (
    <DottedSeparator />
  );

  if (label) {
    return (
      <>
        {topSeparator && separator}
        <div className={baseStyles}>
          {Icon && <Icon className={iconStyles} />}
          {Icon && <Separator className="!w-0.5 !h-4 mx-2" orientation="vertical" />}
          {label}
        </div>
        {bottomSeparator && separator}
      </>
    );
  }

  return (
    <>
      {topSeparator && separator}
      <div className="p-3">
        <div className="inline-block rounded-md bg-primary-foreground p-2.5 text-muted-foreground">
          {Icon && <Icon className="size-4" />}
        </div>
      </div>
      {bottomSeparator && separator}
    </>
  );
}
