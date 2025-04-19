import { Link, useLocation } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { cn } from "~/lib/utils";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  items?: NavigationItem[];
};

type HeaderNavigationDrawerItemProps = NavigationItem;

export const HeaderNavigationDrawerItem = ({
  href,
  icon: Icon,
  label,
  items,
}: HeaderNavigationDrawerItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  if (items) {
    return (
      <AccordionItem value={href} className="border-none">
        <AccordionTrigger className="group rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2 text-sm">
            <Icon
              className={cn(
                "size-4",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            <span
              className={cn(
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground group-hover:text-foreground"
              )}
            >
              {label}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="ml-3 space-y-1 px-3 pb-0">
          {items.map((item) => (
            <HeaderNavigationDrawerItem
              {...item}
              key={`${item.href}-${item.label}`}
            />
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
        "transition-colors hover:bg-muted/50",
        isActive
          ? "bg-muted font-medium text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
      key={`${href}-link`}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon
        className={cn(
          "size-4",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}
      />
      {label}
    </Link>
  );
};
