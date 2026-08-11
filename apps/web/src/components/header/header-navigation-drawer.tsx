
import { useEffect, useState } from "react"
import { useLocation } from "@tanstack/react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { CommandIcon, InstagramIcon, Mail01Icon } from "@hugeicons/core-free-icons"

import { navigationData } from "./header-navigation-data"
import { HeaderNavigationDrawerItem } from "./header-navigation-drawer-item"
import { Accordion } from "@fsx/ui/components/accordion"
import { Button } from "@fsx/ui/components/button"
import { Drawer, DrawerContent, DrawerTrigger } from "@fsx/ui/components/drawer"

export const HeaderNavigationDrawer = () => {
  const [open, setOpen] = useState(false)
  const pathname = useLocation().pathname

  // biome-ignore lint/correctness/useExhaustiveDependencies: No
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Drawer onOpenChange={setOpen} open={open}>
      <DrawerTrigger>
        <Button
          aria-label="Toggle navigation menu"
          className="shrink-0 p-2 hover:bg-muted/50 lg:hidden"
          size="icon"
          variant="outline"
        >
          <HugeiconsIcon className="size-4" icon={CommandIcon} />
        </Button>
      </DrawerTrigger>

      <DrawerContent className="rounded-t-lg border-t p-4">
        <div>
          <Accordion className="space-y-2 p-4">
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
              icon={Mail01Icon}
              target="_blank"
            />
          </Accordion>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
