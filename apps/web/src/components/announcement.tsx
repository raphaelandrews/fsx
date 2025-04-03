import { Link } from "@tanstack/react-router";
import { ArrowRightIcon, type LucideIcon } from "lucide-react";

import { Separator } from "@/components/ui/separator";

interface Props {
  label?: string;
  href?: string;
  icon: LucideIcon;
}

export function Announcement({ label, href, icon: Icon }: Props) {
  if (href) {
    return (
      <Link
        to={href}
        className="group inline-flex items-center px-0.5 text-sm font-medium"
      >
        <Icon className="h-4 w-4" />
        <Separator className="mx-2 !h-4" orientation="vertical" />
        <span className="underline-offset-4 group-hover:underline">
          {label}
        </span>
        <ArrowRightIcon className="ml-1 h-4 w-4" />
      </Link>
    );
  }

  if (label) {
    return (
      <div className="group inline-flex items-center px-0.5 text-sm font-medium">
        <Icon className="h-4 w-4" />
        <Separator className="mx-2 h-4" orientation="vertical" /> {label}
      </div>
    );
  }

  return (
    <div className="inline-block p-2.5 text-muted-foreground rounded-md bg-primary-foreground">
      <Icon width={16} height={16} />
    </div>
  );
}
