"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CommandIcon } from "lucide-react";


import { navigationData } from "@/components/header-navigation-data";
import { HeaderNavigationDrawerItem } from "@/components/header-navigation-drawer-item";
import { ModeToggle } from "@/components/mode-toggle";

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
        <Button size="icon" variant="ghost" className="lg:hidden">
          <CommandIcon width={16} height={16} />
          <span className="sr-only">Menu</span>
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        <div className="flex flex-col gap-4 p-4">
          <div className="space-y-4">
            <Accordion type="multiple">
              <nav className="flex flex-col space-y-2">
                {navigationData().map((item) => {
                  return (
                    <HeaderNavigationDrawerItem {...item} key={item.href} />
                  );
                })}
              </nav>
            </Accordion>
          </div>

          <div className="flex gap-1">
  
            <ModeToggle />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
