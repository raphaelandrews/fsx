"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CommandIcon, InstagramIcon, MailIcon } from "lucide-react";

import { navigationData } from "./header-navigation-data";
import { HeaderNavigationDrawerItem } from "./header-navigation-drawer-item";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

export const HeaderNavigationDrawer = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: No
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Drawer onOpenChange={setOpen} open={open}>
      <DrawerTrigger asChild>
        <Button
          aria-label="Toggle navigation menu"
          className="shrink-0 p-2 hover:bg-muted/50 lg:hidden"
          size="sm"
          variant="ghost"
        >
          <CommandIcon className="size-4" />
        </Button>
      </DrawerTrigger>

      <DrawerContent className="rounded-t-lg border-t p-4">
        <div>
          <Accordion className="space-y-2 p-4" type="multiple">
            <nav className="flex flex-col gap-1">
              {navigationData().map((item) => (
                <HeaderNavigationDrawerItem {...item} key={item.href} />
              ))}
            </nav>
            <HeaderNavigationDrawerItem
              label="Instagram"
              href="https://www.instagram.com/xadrezsergipe/"
              icon={InstagramIcon}
							target="_blank"
            />
            <HeaderNavigationDrawerItem
              label="Email"
              href="mailto:fsx.presidente@gmail.com"
              icon={MailIcon}
							target="_blank"
            />
          </Accordion>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
