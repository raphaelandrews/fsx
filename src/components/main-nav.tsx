import { ClientOnly, Link, useLocation } from "@tanstack/react-router";

import { cn } from "~/lib/utils";
import { getGradient } from "~/lib/generate-gradients";

import { navigationData } from "~/components/header-navigation-data";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "~/components/ui/navigation-menu";

export function MainNav() {
  return (
    <div className="flex mr-4">
      <Link to="/" className="mr-4 flex items-center space-x-2 lg:mr-6">
        <span className="font-bold mt-0.5">FSX</span>
      </Link>
      <ClientOnly fallback={<NavigationMenuSkeleton />}>
        <NavigationMenuContentComponent />
      </ClientOnly>
    </div>
  );
}

function NavigationMenuSkeleton() {
  const items = navigationData();

  return (
    <div className="hidden text-sm lg:flex items-center gap-6 ml-1">
      {items.map((item) => (
        <span key={item.label}>{item.label}</span>
      ))}
    </div>
  );
}

function NavigationMenuContentComponent() {
  const location = useLocation();
  const items = navigationData();

  const getIsActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <NavigationMenu className="hidden lg:block ml-1">
      <NavigationMenuList className="gap-4 text-sm lg:gap-6 space-x-[inherit]">
        {items.map(({ label, items, icon: Icon, href, target }) => {
          const hasItems = Boolean(items?.length);

          if (hasItems)
            return (
              <NavigationMenuItem key={label}>
                <NavigationMenuTrigger
                  className={cn(
                    "p-0 transition-colors hover:cursor-pointer hover:text-foreground/80 text-foreground/60 bg-transparent hover:bg-transparent focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent",
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
                              to={href}
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
                to={href}
                target={target}
                className="flex items-center gap-2"
              >
                {label}
              </Link>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const NavigationMenuImage = ({ href }: { href: string }) => {
  const gradient = getGradient();

  return (
    <>
      {href === "#" && (
        <div
          className={`${gradient} relative h-[185px] w-[128px] min-w-[128px] bg-gradient-to-br from-cyan-500 to-blue-500 overflow-hidden rounded-md border shadow`}
        />
      )}
      {href === "##" && (
        <div
          className={`${gradient} relative h-[185px] w-[128px] min-w-[128px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden rounded-md border shadow`}
        />
      )}
    </>
  );
};
