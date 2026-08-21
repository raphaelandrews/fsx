
import { Link } from "@tanstack/react-router"
import { useLocation } from "@tanstack/react-router"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@fsx/ui/lib/utils"

import { navigationData } from "./header-navigation-data"
import { Logo } from "../logo"
import { LogoContextMenu } from "./logo-context-menu"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@fsx/ui/components/navigation-menu"

export function MainNav() {
  const pathname = useLocation().pathname
  const items = navigationData()

  const getIsActive = (href: string) => pathname === href

  return (
    <div className="flex flex-1 items-center">
      {pathname === "/" ? (
        <div className="mr-4 flex items-center space-x-2">
          <LogoContextMenu>
            <Logo className="h-4 text-foreground" />
          </LogoContextMenu>
        </div>
      ) : (
        <Link to="/" className="mr-4 flex items-center space-x-2">
          <LogoContextMenu>
            <Logo className="h-4 text-foreground" />
          </LogoContextMenu>
        </Link>
      )}
      <NavigationMenu
        className="mx-auto hidden xl:block"
        positionerClassName="!left-0 !right-0 !w-auto !max-w-none !top-18 md:!top-24 !px-6 sm:!px-8"
        popupClassName="!w-full !max-w-[1080px] !mx-auto !mt-2 !rounded-2xl !ring-border !shadow-[0_24px_60px_color-mix(in_oklab,var(--primary-foreground)_12%,transparent)]"
      >
        <NavigationMenuList className="gap-2 text-sm">
          {items.map(({ label, items, href, target }) => {
            const hasItems = Boolean(items?.length)

            if (hasItems) {
              return (
                <NavigationMenuItem key={label}>
                  <NavigationMenuTrigger
                    className={cn(
                      "rounded-full bg-transparent px-4 text-foreground/70 hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-popup-open:bg-muted data-popup-open:text-foreground data-open:bg-muted data-open:text-foreground",
                      getIsActive(href) && "text-foreground"
                    )}
                  >
                    {label}
                  </NavigationMenuTrigger>

                  <NavigationMenuContent className="!p-0">
                    <ul className="grid gap-2 p-6 sm:grid-cols-2 lg:grid-cols-3 !list-none !m-0">
                      {items?.map(
                        ({ href, icon: Icon, label, description }) => {
                          return (
                            <li key={label}>
                              <NavigationMenuLink
                                render={<Link to={href} />}
                                className="group flex h-full items-start gap-3 rounded-xl border border-transparent p-4 transition-colors hover:border-border hover:bg-muted focus-visible:border-border focus-visible:bg-muted select-none"
                              >
                                <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-primary-foreground transition-colors group-hover:bg-primary">
                                  <HugeiconsIcon
                                    className="size-[18px]"
                                    icon={Icon}
                                  />
                                </span>
                                <span className="flex flex-col">
                                  <span className="text-[15px] font-semibold text-primary-foreground">
                                    {label}
                                  </span>
                                  <span className="text-[13px] leading-snug text-muted-foreground">
                                    {description}
                                  </span>
                                </span>
                              </NavigationMenuLink>
                            </li>
                          )
                        }
                      )}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )
            }

            return (
              <NavigationMenuItem key={label}>
                <Link
                  className={cn(
                    "flex h-9 items-center rounded-full px-3 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground",
                    getIsActive(href) && "text-foreground"
                  )}
                  to={href}
                  target={target}
                >
                  {label}
                </Link>
              </NavigationMenuItem>
            )
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}
