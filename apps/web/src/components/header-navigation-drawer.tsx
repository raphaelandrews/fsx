import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { CommandIcon } from "lucide-react";

import { navigationData } from "~/components/header-navigation-data";
import { HeaderNavigationDrawerItem } from "~/components/header-navigation-drawer-item";
import { CommandMenu } from "~/components/command-menu";
import { ModeToggle } from "~/components/mode-toggle";
import { Accordion } from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "~/components/ui/drawer";

export const HeaderNavigationDrawer = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navItems = navigationData();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="lg:hidden hover:bg-muted/50 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <CommandIcon className="size-4" />
        </Button>
      </DrawerTrigger>

      <DrawerContent className="rounded-t-lg border-t">
        <div className="flex flex-col gap-4 p-4">
          <Accordion type="multiple" className="space-y-2">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <HeaderNavigationDrawerItem 
                  {...item} 
                  key={`${item.href}-drawer`} 
                />
              ))}
            </nav>
          </Accordion>

          <div className="flex gap-2 pt-2">
            <CommandMenu />
            <ModeToggle />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};