import { HugeiconsIcon } from "@hugeicons/react"
import { InstagramIcon, Mail01Icon } from "@hugeicons/core-free-icons"

import { MainNav } from "./main-nav"
import { HeaderNavigationDrawer } from "./header-navigation-drawer"
import { CommandMenu } from "../command-menu"
import { UpdateRegister } from "../update-register"
import { buttonVariants } from "@fsx/ui/components/button"
import { Separator } from "@fsx/ui/components/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@fsx/ui/components/tooltip"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="!max-w-[1280px] container flex h-14 items-center">
        <MainNav />
        <div className="ml-auto flex items-center gap-2 md:flex-1 md:justify-end">
          <div className="flex w-full flex-1 md:w-auto md:flex-none">
            <CommandMenu />
          </div>
          <Separator className="!w-0.5 !h-4 ml-2 mr-1" orientation="vertical" />

          <UpdateRegister />

          <Tooltip>
            <TooltipTrigger
              className="!hidden sm:!flex"
              render={
                <a
                  className={buttonVariants({ variant: "outline", size: "icon" })}
                  href="https://www.instagram.com/xadrezsergipe/"
                  rel="noreferrer"
                  target="_blank"
                />
              }
            >
              <HugeiconsIcon icon={InstagramIcon} size={16} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Instagram</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              className="!hidden sm:!flex"
              render={
                <a
                  className={buttonVariants({ variant: "outline", size: "icon" })}
                  href="mailto:fsx.presidente@gmail.com"
                  rel="noreferrer"
                  target="_blank"
                />
              }
            >
              <HugeiconsIcon icon={Mail01Icon} size={16} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Email</p>
            </TooltipContent>
          </Tooltip>

          <HeaderNavigationDrawer />
        </div>
      </div>
    </header>
  )
}
