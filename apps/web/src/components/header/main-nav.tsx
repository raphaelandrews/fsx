import type { ComponentProps, ComponentPropsWithoutRef } from "react";

import { Link, useLocation } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@fsx/ui/components/navigation-menu";

import { navigationData } from "./header-navigation-data";
import { Logo } from "../logo";
import { LogoContextMenu } from "./logo-context-menu";

export function MainNav() {
  const pathname = useLocation().pathname;
  const items = navigationData();

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
            <Logo className="h-4 text-foreground hover:text-primary transition-colors" />
          </LogoContextMenu>
        </Link>
      )}
      <NavigationMenu className="mx-auto hidden xl:block">
        <NavigationMenuList>
          {items.map(({ label, items, href, target }) => {
            const hasItems = Boolean(items?.length);

            if (hasItems) {
              return (
                <NavigationMenuItem key={label}>
                  <NavigationMenuTrigger>{label}</NavigationMenuTrigger>
                  <NavigationMenuContent className="p-0">
                    <ul className="m-0 flex w-64 list-none flex-col gap-1.5 p-2">
                      {items?.map(({ href, icon, label }) => (
                        <ListItem key={label} href={href} icon={icon} title={label} />
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              );
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
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

function ListItem({
  title,
  href,
  icon,
  ...props
}: ComponentPropsWithoutRef<"li"> & {
  href: string;
  icon: ComponentProps<typeof HugeiconsIcon>["icon"];
}) {
  return (
    <li {...props}>
      <NavigationMenuLink
        className="group w-full justify-start gap-1.5 rounded-[6px] p-2 bg-muted text-muted-foreground transition-colors duration-200 select-none hover:bg-primary"
        render={
          <Link to={href}>
            <HugeiconsIcon className="size-4 text-muted-foreground group-hover:text-primary-foreground transition-colors" icon={icon} />
            <span className="text-sm font-medium text-foreground group-hover:text-primary-foreground transition-colors">{title}</span>
          </Link>
        }
      />
    </li>
  );
}
