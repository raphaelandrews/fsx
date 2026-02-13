/** biome-ignore-all lint/nursery/noShadow: No */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { navigationData } from "./header-navigation-data";
import { DottedSeparator } from "@/components/dotted-separator";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export function MainNav() {
  const pathname = usePathname();
  const items = navigationData();

  const getIsActive = (href: string) => pathname === href;

  return (
    <div className="mr-4 flex">
      {pathname === "/" ? (
        <div className="mr-4 flex items-center space-x-2 lg:mr-6">
          <span className="mt-0.5 font-bold">FSX</span>
        </div>
      ) : (
        <Link href="/" className="mr-4 flex items-center space-x-2 lg:mr-6">
          <span className="mt-0.5 font-bold">FSX</span>
        </Link>
      )}
      <NavigationMenu className="ml-1 hidden lg:block">
        <NavigationMenuList className="gap-4 space-x-[inherit] text-sm lg:gap-6">
          {items.map(({ label, items, href, target }) => {
            const hasItems = Boolean(items?.length);

            if (hasItems) {
              return (
                <NavigationMenuItem key={label}>
                  <NavigationMenuTrigger
                    className={cn(
                      "bg-transparent p-0 text-foreground/60 transition-colors hover:cursor-pointer hover:bg-transparent hover:text-foreground/80 focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent",
                      getIsActive(href) && "text-foreground"
                    )}
                  >
                    {label}
                  </NavigationMenuTrigger>

                  <NavigationMenuContent className="!p-0">
                    <div className="relative w-[250px] p-0 border rounded-none bg-popover">
                      <ul className="grid grid-cols-1 gap-0 relative z-0 !list-none !p-0 !m-0">
                        {items?.map(
                          ({ href, icon: Icon, label, description }, index) => {
                            const isLast = index === items.length - 1;

                            return (
                              <li key={label} className="relative">
                                <NavigationMenuLink asChild>
                                  <Link
                                    className={cn(
                                      "group flex flex-row items-center gap-4 p-3 hover:bg-muted/50 transition-colors !rounded-none outline-none focus:bg-muted/50 select-none mx-1 my-1.25",
                                      getIsActive(href) && "bg-muted"
                                    )}
                                    href={href}
                                  >
                                    <div className="flex items-center justify-center size-8 rounded-md border bg-background group-hover:bg-primary group-hover:border-primary transition-colors duration-300 shrink-0">
                                      <Icon className="size-4 group-hover:text-primary-foreground transition-colors duration-300" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      <span className="text-sm font-semibold leading-none">
                                        {label}
                                      </span>
                                      <span className="text-xs text-muted-foreground font-medium line-clamp-2 leading-snug">
                                        {description}
                                      </span>
                                    </div>
                                  </Link>
                                </NavigationMenuLink>
                                {!isLast && (
                                  <DottedSeparator className="w-full absolute bottom-0 left-0" />
                                )}
                              </li>
                            );
                          }
                        )}
                      </ul>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              );
            }

            return (
              <NavigationMenuItem
                asChild
                className={cn(
                  navigationMenuTriggerStyle(),
                  "bg-transparent p-0 text-foreground/60 transition-colors hover:bg-transparent hover:text-foreground/80 focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent",
                  getIsActive(href) && "text-foreground"
                )}
                key={label}
              >
                <Link
                  className="flex items-center gap-2"
                  href={href}
                  target={target}
                >
                  {label}
                </Link>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
