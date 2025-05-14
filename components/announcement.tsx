import Link from "next/link";
import { ArrowRightIcon, type LucideIcon } from "lucide-react";

import { Separator } from "@/components/ui/separator";

interface Props {
  label?: string;
  href?: string;
  icon: LucideIcon;
}

export function Announcement({ label, href, icon: Icon }: Props) {
  const baseStyles = "inline-flex items-center px-0.5 text-sm font-medium";
  const iconStyles = "size-4";
  const hoverStyles = href ? "underline-offset-4 hover:underline" : "";

  if (href) {
    return (
      <Link href={href} prefetch={true} className={`group ${baseStyles}`}>
        <Icon className={iconStyles} />
        <Separator className="mx-2 !w-0.5 !h-4" orientation="vertical" />
        <span className={hoverStyles}>{label}</span>
        <ArrowRightIcon className="ml-1 size-4" />
      </Link>
    );
  }

  if (label) {
    return (
      <div className={baseStyles}>
        <Icon className={iconStyles} />
        <Separator className="mx-2 !w-0.5 !h-4" orientation="vertical" />
        {label}
      </div>
    );
  }

  return (
    <div className="inline-block p-2.5 text-muted-foreground rounded-md bg-primary-foreground">
      <Icon className="size-4" />
    </div>
  );
}
