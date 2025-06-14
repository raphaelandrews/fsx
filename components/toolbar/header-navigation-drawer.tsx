"use client";

import { useEffect, useState } from "react";
import { CommandIcon } from "lucide-react";

import { navigationItems } from "./header-navigation-data";
import { HeaderNavigationDrawerItem } from "./header-navigation-drawer-item";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

export const HeaderNavigationDrawer = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, []);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="shrink-0 lg:hidden hover:bg-muted/50"
          aria-label="Toggle navigation menu"
        >
          <CommandIcon className="h-4 w-4" />
        </Button>
      </DrawerTrigger>

      <DrawerContent className="rounded-t-lg border-t">
        <div className="flex flex-col gap-4 p-4">
          <Accordion type="multiple" className="space-y-2">
            <nav className="flex flex-col gap-1">
              {navigationItems.map((item) => (
                <HeaderNavigationDrawerItem {...item} key={item.href} />
              ))}
            </nav>
          </Accordion>

          <div className="flex gap-2 pt-2">
            <ThemeSwitcher />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

