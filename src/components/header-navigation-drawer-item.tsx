import { Link, useLocation } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";

import { cn } from "~/lib/utils";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";

export type Item = {
  label: string;
  href: string;
  icon: LucideIcon;
  target: string;
  items?: Item[];
};

export type HeaderNavigationDrawerItemProps = Item & {
  items?: Item[];
};

export const HeaderNavigationDrawerItem = ({
  href,
  icon: Icon,
  label,
  target,
  items,
}: HeaderNavigationDrawerItemProps) => {
  const location = useLocation();

  const getIsActive = (href: string) => {
    return location.pathname === href;
  };

  if (items) {
    return (
      <AccordionItem value={href} className="border-none">
        <AccordionTrigger className="group rounded-lg px-3 py-2 transition-colors hover:bg-muted/50">
          <div className="flex items-center gap-2 text-sm">
            <Icon
              width={16}
              height={16}
              className="text-muted-foreground group-hover:text-foreground"
            />
            <span className="text-muted-foreground group-hover:text-foreground">
              {label}
            </span>
          </div>
        </AccordionTrigger>

        <AccordionContent className="ml-3 space-y-1 px-3 pb-0">
          {items.map((item) => (
            <HeaderNavigationDrawerItem {...item} key={item.href} />
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  const isActive = getIsActive(href);

  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      )}
      key={href}
      target={target}
    >
      <Icon
        width={16}
        height={16}
        className={isActive ? "text-foreground" : "text-muted-foreground"}
      />
      {label}
    </Link>
  );
};
