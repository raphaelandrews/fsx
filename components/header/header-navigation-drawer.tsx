"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CommandIcon } from "lucide-react";

import { navigationData } from "./header-navigation-data";
import { HeaderNavigationDrawerItem } from "./header-navigation-drawer-item";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

export const HeaderNavigationDrawer = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="shrink-0 lg:hidden hover:bg-muted/50"
          aria-label="Toggle navigation menu"
        >
          <CommandIcon className="size-4" />
        </Button>
      </DrawerTrigger>

      <DrawerContent className="rounded-t-lg border-t p-4">
        <div>
          <Accordion type="multiple" className="space-y-2 p-4">
            <nav className="flex flex-col gap-1">
              {navigationData().map((item) => (
                <HeaderNavigationDrawerItem {...item} key={item.href} />
              ))}
            </nav>
          </Accordion>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
