"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { navigationItems } from "./header-navigation-data";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";

export function MainNav() {
  const pathname = usePathname();
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const iconRefs = React.useRef<Record<string, React.RefObject<any>>>({});

  for (const item of navigationItems) {
    if (!iconRefs.current[item.label]) {
      iconRefs.current[item.label] = React.createRef();
    }
  }

  const getIsActive = (href: string) => pathname === href;

  return (
    <div className="flex items-center">
      {pathname !== "/" ? (
        <Link href="/" className="flex font-bold mt-0.5 px-2">
          FSX
        </Link>
      ) : (
        <span className="flex font-bold mt-0.5 px-2">FSX</span>
      )}

      <Separator className="mx-2 !w-0.5 !h-4" orientation="vertical" />

      <NavigationMenu className="hidden lg:block">
        <NavigationMenuList className="gap-1.5">
          {navigationItems.map(({ label, items, icon: Icon, href, target }) => {
            const hasItems = Boolean(items?.length);

            if (hasItems)
              return (
                <NavigationMenuItem key={label}>
                  <NavigationMenuTrigger
                    className={cn(
                      "px-3 transition-colors hover:cursor-pointer hover:text-foreground text-foreground/60 bg-transparent hover:bg-secondary focus:bg-secondary data-[active]:bg-secondary data-[state=open]:bg-secondary",
                      getIsActive(href) && "text-foreground"
                    )}
                  >
                    {label}
                  </NavigationMenuTrigger>

                  <NavigationMenuContent className="flex gap-4 p-4 md:w-[500px] lg:w-[700px]">
                    {href === "#" && <NavigationMenuImage href={href} />}
                    {href === "##" && <NavigationMenuImage href={href} />}

                    <ul
                      className="flex flex-wrap gap-3 w-full"
                      style={{ maxHeight: "400px" }}
                    >
                      {items?.map(
                        ({ href, icon: Icon, label, description }, index) => (
                          <li key={label} className="flex-[1_1_45%]">
                            <NavigationMenuLink asChild>
                              <Link
                                href={href}
                                className={cn(
                                  "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-foreground focus:bg-accent focus:text-foreground",
                                  getIsActive(href) && "bg-muted"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <Icon size={12} />
                                  <div className="text-sm font-medium leading-none">
                                    {label}
                                  </div>
                                </div>

                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {description}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        )
                      )}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              );

            return (
              <NavigationMenuItem
                key={label}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "px-3 transition-colors hover:text-foreground text-foreground/60 bg-transparent hover:bg-secondary focus:bg-secondary data-[active]:bg-secondary data-[state=open]:bg-secondary",
                  getIsActive(href) && "text-foreground"
                )}
                asChild
              >
                <Link
                  href={href}
                  target={target}
                  className="flex items-center gap-2"
                >
                  {label}
                </Link>
              </NavigationMenuItem>
            );

            {
              // biome-ignore lint/complexity/noUselessLoneBlockStatements: animated icons
              /*if (hasItems)
              return (
                <NavigationMenuItem key={label}>
                  <NavigationMenuTrigger
                    className={cn(
                      "p-0 max-h-8 transition-colors hover:text-foreground/80 text-foreground/60 hover:!bg-accent",
                      getIsActive(href) && "text-foreground"
                    )}
                    onMouseEnter={() =>
                      iconRefs.current[label]?.current?.startAnimation()
                    }
                    onMouseLeave={() =>
                      iconRefs.current[label]?.current?.stopAnimation()
                    }
                  >
                    <Button asChild variant="ghost" size="sm" className="p-2">
                      <Icon
                        ref={iconRefs.current[label]}
                        size={16}
                        className="text-foreground/60 hover:text-foreground"
                      />
                    </Button>
                  </NavigationMenuTrigger>

                  <NavigationMenuContent className="flex gap-4 p-4 md:w-[500px] lg:w-[700px]">
                    {href === "#" && <NavigationMenuImage href={href} />}
                    {href === "##" && <NavigationMenuImage href={href} />}

                    <ul
                      className="flex flex-wrap gap-3 w-full"
                      style={{ maxHeight: "400px" }}
                    >
                      {items?.map(
                        ({ href, icon: Icon, label, description }, index) => (
                          <li key={label} className="flex-[1_1_45%]">
                            <NavigationMenuLink asChild>
                              <Link
                                href={href}
                                className={cn(
                                  "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                  getIsActive(href) && "bg-muted"
                                )}
                              >
                                <Icon size={12} />

                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {description}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        )
                      )}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              );

            return (
              <NavigationMenuItem
                key={label}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "p-0",
                  getIsActive(href) && "text-foreground"
                )}
                asChild
              >
                <Button 
                  asChild 
                  variant="ghost" 
                  size="sm" 
                  className="p-2 max-h-8 text-foreground/60 hover:text-foreground/80 hover:bg-accent"
                >
                  <Link
                    href={href}
                    target={target}
                    onMouseEnter={() =>
                      iconRefs.current[label]?.current?.startAnimation()
                    }
                    onMouseLeave={() =>
                      iconRefs.current[label]?.current?.stopAnimation()
                    }
                  >
                    <Icon
                      ref={iconRefs.current[label]}
                      size={16}
                      className="hover:text-foreground"
                    />
                  </Link>
                </Button>
              </NavigationMenuItem>
            );*/
            }
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

const NavigationMenuImage = ({ href }: { href: string }) => {
  return (
    <>
      {href === "#" && (
        <div className="relative h-[185px] w-[128px] min-w-[128px] bg-gradient-to-br from-cyan-500 to-blue-500 overflow-hidden rounded-md border shadow" />
      )}
      {href === "##" && (
        <div className="relative h-[185px] w-[128px] min-w-[128px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden rounded-md border shadow" />
      )}
    </>
  );
};
