import Link from "next/link";
import { ArrowRightIcon, type LucideIcon } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { DottedY } from "@/components/dotted-y";
import { DottedX } from "@/components/dotted-x";

interface Props {
  label?: string;
  href?: string;
  icon: LucideIcon;
}

export function Announcement({ label, href, icon: Icon }: Props) {
  const baseStyles = "inline-flex items-center px-0.5 text-sm font-bold";
  const iconStyles = "size-4";
  const hoverStyles = href ? "underline-offset-4 hover:underline" : "";

  if (href) {
    return (
      <>
        <DottedX>
          <Link className={`group ${baseStyles}`} href={href}>
            <Icon className={iconStyles} />
            <Separator className="!w-0.5 !h-4 mx-2" orientation="vertical" />
            <span className={hoverStyles}>{label}</span>
            <ArrowRightIcon className="ml-1 size-4" />
          </Link>
        </DottedX>
        <DottedY />
      </>
    );
  }

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
        <DottedY />
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
      <DottedY />
    </>
  );
}
