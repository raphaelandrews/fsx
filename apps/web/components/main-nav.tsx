"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { getGradient } from "@/utils/generate-gradients";

import { navigationData } from "@/components/header-navigation-data";
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

  const getIsActive = (href: string) => {
    return pathname === href;
  };

  return (
    <div className="flex mr-4">
      <Link
        href="/"
        prefetch={true}
        className="mr-4 flex items-center space-x-2 lg:mr-6"
      >
        <span className="font-bold mt-0.5">FSX</span>
      </Link>
      <NavigationMenu className="hidden lg:block">
        <NavigationMenuList className="gap-4 text-sm lg:gap-6 space-x-[inherit]">
          {items.map(({ label, items, icon: Icon, href, target }) => {
            const hasItems = Boolean(items?.length);

            if (hasItems)
              return (
                <NavigationMenuItem key={label}>
                  <NavigationMenuTrigger
                    className={cn(
                      "p-0 transition-colors hover:text-foreground/80 text-foreground/60 bg-transparent hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent",
                      getIsActive(href) && "text-foreground"
                    )}
                  >
                    {label}
                  </NavigationMenuTrigger>

                  <NavigationMenuContent className="flex gap-4 p-4 md:w-[500px] lg:w-[700px]">
                    {href === "#" && <NavigationMenuImage href={href} />}
                    {href === "##" && <NavigationMenuImage href={href} />}

                    <ul className="grid w-2/3 gap-3 lg:grid-cols-2">
                      {items?.map(
                        ({ href, icon: Icon, label, description }) => (
                          <li key={label}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={href}
                                prefetch={true}
                                className={cn(
                                  "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                  getIsActive(href) && "bg-muted"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <Icon width={12} height={12} />
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
                  "p-0 transition-colors hover:text-foreground/80 text-foreground/60 bg-transparent hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent",
                  getIsActive(href) && "text-foreground"
                )}
                asChild
              >
                <Link
                  href={href}
                  target={target}
                  prefetch={true}
                  className="flex items-center gap-2"
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

const NavigationMenuImage = ({ href }: { href: string }) => {
  return (
    <>
      {href === "#" && (
        <div
          className={
            "relative h-[265px] w-[164px] bg-gradient-to-br from-cyan-500 to-blue-500 overflow-hidden rounded-md border shadow"
          }
        />
      )}
      {href === "##" && (
        <div
          className={
            "relative h-[265px] w-[164px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden rounded-md border shadow"
          }
        />
      )}
    </>
  );
};
