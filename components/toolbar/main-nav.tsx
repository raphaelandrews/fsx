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
    <div className="flex mr-4">
      <Link href="/" className="mr-4 flex items-center space-x-2 lg:mr-6">
        <span className="font-bold mt-0.5">FSX</span>
      </Link>
      <NavigationMenu className="hidden lg:block ml-1">
        <NavigationMenuList className="gap-4 text-sm lg:gap-6 space-x-[inherit]">
          {navigationItems.map(({ label, items, icon: Icon, href, target }) => {
            const hasItems = Boolean(items?.length);

            if (hasItems)
              return (
                <NavigationMenuItem key={label}>
                  <NavigationMenuTrigger
                    className={cn(
                      "p-0 transition-colors hover:cursor-pointer hover:text-foreground/80 text-foreground/60 bg-transparent hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent",
                      getIsActive(href) && "text-foreground"
                    )}
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
                      className="text-foreground/60 hover:text-foreground"
                    />
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
                  "p-0 transition-colors hover:text-foreground/80 text-foreground/60 bg-transparent hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent",
                  getIsActive(href) && "text-foreground"
                )}
                asChild
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
                    className="text-foreground/60 hover:text-foreground"
                  />
                </Link>
              </NavigationMenuItem>
            );
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
