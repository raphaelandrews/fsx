"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { LucideIcon } from "lucide-react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { cn } from "@/lib/utils";

export type Item = {
  label: string;
  href: string;
  icon: LucideIcon;
  items?: Item[];
};

export type HeaderNavigationDrawerItemProps = Item & {
  items?: Item[];
};

export const HeaderNavigationDrawerItem = ({
  href,
  icon: Icon,
  label,
  items,
}: HeaderNavigationDrawerItemProps) => {
  const pathname = usePathname();

  const getIsActive = (href: string) => {
    return pathname === href;
  };

  if (items)
    return (
      <div>
        <AccordionItem value={href} className="border-b-0">
          <AccordionTrigger className="rounded-lg px-3 py-2">
            <div className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <Icon width={16} height={16} />
              {label}
            </div>
          </AccordionTrigger>

          <AccordionContent className="ml-3 space-y-1 px-3 pb-0">
            {items.map((item) => (
              <HeaderNavigationDrawerItem {...item} key={item.label} />
            ))}
          </AccordionContent>
        </AccordionItem>
      </div>
    );

  return (
    <Link
      href={href}
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm",
        getIsActive(href)
          ? "bg-muted font-bold"
          : "font-normal text-muted-foreground hover:bg-muted"
      )}
      key={href}
    >
      <Icon width={16} height={16} />
      {label}
    </Link>
  );
};
