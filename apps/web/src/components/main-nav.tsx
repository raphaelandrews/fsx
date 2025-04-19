import { Link, useLocation } from "@tanstack/react-router";
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
import type { LucideIcon } from "lucide-react";

type NavigationItem = {
  label: string;
  href: string;
  icon?: LucideIcon;
  description?: string;
  target?: string;
  items?: NavigationItem[];
};

type NavigationItemProps = {
  item: NavigationItem;
  isActive: boolean;
};

export function MainNav() {
  const location = useLocation();
  const items = navigationData();

  const getIsActive = (href: string) => location.pathname === href;

  return (
    <div className="flex mr-4">
      <Link
        to="/"
        className="mr-4 flex items-center gap-2 lg:mr-6 group"
        aria-label="Home"
      >
        <span className="font-bold text-lg group-hover:text-primary transition-colors">
          FSX
        </span>
      </Link>

      <NavigationMenu className="hidden lg:block">
        <NavigationMenuList className="gap-4 text-sm lg:gap-6">
          {items.map((item) => {
            const isActive = getIsActive(item.href);
            const navItemClass = cn(
              "p-0 transition-colors hover:text-foreground/80 text-foreground/60",
              "bg-transparent hover:bg-transparent focus:bg-transparent",
              "data-[active]:bg-transparent data-[state=open]:bg-transparent",
              isActive && "text-foreground"
            );

            if (item.items?.length) {
              return (
                <NavigationMenuItem key={`nav-${item.label}-${item.href}`}>
                  <NavigationMenuTrigger className={navItemClass}>
                    {item.label}
                  </NavigationMenuTrigger>

                  <NavigationMenuContent className="flex gap-4 p-4 md:w-[500px] lg:w-[700px]">
                    {(item.href === "#" || item.href === "##") && (
                      <NavigationMenuImage href={item.href} />
                    )}

                    <ul className="grid w-2/3 gap-3 lg:grid-cols-2">
                      {item.items.map((subItem) => (
                        <NavigationItem
                          key={`sub-${subItem.label}-${subItem.href}`}
                          item={subItem}
                          isActive={getIsActive(subItem.href)}
                        />
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              );
            }

            return (
              <NavigationMenuItem
                key={`nav-${item.label}-${item.href}`}
                className={cn(navigationMenuTriggerStyle(), navItemClass)}
                asChild
              >
                <Link
                  to={item.href}
                  target={item.target}
                  className="flex items-center gap-2"
                >
                  {item.label}
                </Link>
              </NavigationMenuItem>
            );
          })}
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

const NavigationItem = ({ item, isActive }: NavigationItemProps) => (
  <li>
    <NavigationMenuLink asChild>
      <Link
        to={item.href}
        className={cn(
          "block select-none space-y-1 rounded-md p-3",
          "leading-none no-underline outline-none transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:bg-accent focus:text-accent-foreground",
          isActive && "bg-muted"
        )}
      >
        <div className="flex items-center gap-2">
          {item.icon && <item.icon className="size-3" />}
          <div className="text-sm font-medium leading-none">{item.label}</div>
        </div>
        {item.description && (
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {item.description}
          </p>
        )}
      </Link>
    </NavigationMenuLink>
  </li>
);

const NavigationMenuImage = ({ href }: { href: string }) => {
  const gradient = getGradient();
  const gradientClass =
    href === "#"
      ? "from-cyan-500 to-blue-500"
      : "from-indigo-500 via-purple-500 to-pink-500";

  return (
    <div
      className={`${gradient} relative h-[265px] w-[164px] bg-gradient-to-br ${gradientClass} overflow-hidden rounded-md border shadow`}
    />
  );
};
