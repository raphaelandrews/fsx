import type { ComponentProps, ComponentPropsWithoutRef } from "react"

import { Link, useLocation } from "@tanstack/react-router"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@fsx/ui/components/navigation-menu"

import { navigationData } from "./header-navigation-data"
import { Logo } from "../logo"
import { LogoContextMenu } from "./logo-context-menu"

export function MainNav() {
  const pathname = useLocation().pathname
  const items = navigationData()

  return (
    <div className="flex flex-1 items-center">
      {pathname === "/" ? (
        <div className="mr-4 flex items-center space-x-2">
          <LogoContextMenu>
            <Logo className="h-4 text-foreground hover:text-primary transition-colors" />
          </LogoContextMenu>
        </div>
      ) : (
        <Link to="/" className="mr-4 flex items-center space-x-2">
          <LogoContextMenu>
            <Logo className="h-4 text-foreground hover:text-primary transition-colors" />
          </LogoContextMenu>
        </Link>
      )}
      <NavigationMenu className="mx-auto hidden xl:block">
        <NavigationMenuList>
          {items.map(({ label, items, href, target }) => {
            const hasItems = Boolean(items?.length)

            if (hasItems) {
              return (
                <NavigationMenuItem key={label}>
                  <NavigationMenuTrigger>{label}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="m-0 flex w-72 list-none flex-col gap-px p-0">
                      {items?.map(({ href, icon, label }) => (
                        <ListItem
                          key={label}
                          href={href}
                          icon={icon}
                          title={label}
                        />
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )
            }

            return (
              <NavigationMenuItem key={label}>
                <NavigationMenuLink
                  className={navigationMenuTriggerStyle()}
                  render={
                    <Link to={href} target={target}>
                      {label}
                    </Link>
                  }
                />
              </NavigationMenuItem>
            )
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  )
}

function ListItem({
  title,
  href,
  icon,
  ...props
}: ComponentPropsWithoutRef<"li"> & {
  href: string
  icon: ComponentProps<typeof HugeiconsIcon>["icon"]
}) {
  return (
    <li {...props}>
      <NavigationMenuLink
        render={
          <Link to={href}>
            <div className="grid w-full grid-cols-[20px_1fr] items-center gap-x-2">
              <span className="flex size-5 items-center justify-center rounded-[2px] bg-muted text-muted-foreground">
                <HugeiconsIcon className="size-4" icon={icon} />
              </span>
              <span className="text-sm/5 font-medium text-foreground">
                {title}
              </span>
            </div>
          </Link>
        }
      />
    </li>
  )
}
