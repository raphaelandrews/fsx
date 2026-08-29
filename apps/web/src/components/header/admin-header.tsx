import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@fsx/ui/components/navigation-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@fsx/ui/components/sheet";
import { cn } from "@fsx/ui/lib/utils";

import { ADMIN_NAV, type AdminNavItem } from "./admin-nav-data";
import { Logo } from "../logo";

function isActive(pathname: string, to: string): boolean {
  if (to === "/dashboard") return pathname === "/dashboard";
  return pathname === to || pathname.startsWith(`${to}/`);
}

export function AdminHeader() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-border/40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-2 px-4 sm:px-6">
        <Link to="/dashboard" className="flex shrink-0 items-center gap-2 font-bold">
          <Logo className="h-6 w-auto" />
          <span className="hidden sm:inline">Admin</span>
        </Link>

        {/* Desktop mega-menu nav */}
        <NavigationMenu className="mx-auto hidden xl:block">
          <NavigationMenuList>
            {ADMIN_NAV.map((item) => (
              <NavigationMenuItem key={item.label}>
                {item.items?.length ? (
                  <>
                    <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
                    <NavigationMenuContent className="p-0">
                      <ul className="m-0 flex w-64 list-none flex-col gap-1.5 p-2">
                        {item.items.map((sub) => (
                          <li key={sub.label}>
                            <NavigationMenuLink
                              className="group w-full justify-start gap-1.5 rounded-[6px] bg-muted p-2 text-muted-foreground transition-colors duration-200 select-none hover:bg-primary"
                              data-active={isActive(pathname, sub.to) || undefined}
                              render={
                                <Link to={sub.to}>
                                  <HugeiconsIcon
                                    className="size-4 text-muted-foreground transition-colors group-hover:text-primary-foreground"
                                    icon={sub.icon}
                                    strokeWidth={2}
                                  />
                                  <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary-foreground">
                                    {sub.label}
                                  </span>
                                </Link>
                              }
                            />
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </>
                ) : (
                  <NavigationMenuLink
                    className={navigationMenuTriggerStyle()}
                    data-active={isActive(pathname, item.to) || undefined}
                    render={<Link to={item.to}>{item.label}</Link>}
                  />
                )}
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile drawer */}
        <div className="ml-auto flex items-center xl:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  aria-label="Open admin menu"
                  className="shrink-0 p-2"
                  size="icon"
                  variant="outline"
                />
              }
            >
              <HugeiconsIcon className="size-4" icon={Menu01Icon} strokeWidth={2} />
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col !w-72 p-0">
              <div className="flex h-14 items-center justify-between border-border/40 border-b px-4">
                <span className="font-bold">FSX Admin</span>
                <SheetClose
                  render={
                    <Button aria-label="Close menu" size="icon" variant="ghost" />
                  }
                >
                  <HugeiconsIcon className="size-5" icon={Cancel01Icon} strokeWidth={2} />
                </SheetClose>
              </div>
              <SheetTitle className="sr-only">Admin navigation menu</SheetTitle>
              <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                {ADMIN_NAV.map((section) => (
                  <div key={section.label}>
                    <p className="px-3 pb-1 pt-3 text-xs font-medium tracking-wide text-muted-foreground/60 uppercase">
                      {section.label}
                    </p>
                    {section.items?.map((sub) => (
                      <MobileNavLink key={sub.label} item={sub} onNavigate={() => setOpen(false)} />
                    ))}
                  </div>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function MobileNavLink({ item, onNavigate }: { item: AdminNavItem; onNavigate: () => void }) {
  const { pathname } = useLocation();
  const active = isActive(pathname, item.to);
  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        active && "bg-accent/60 text-foreground",
      )}
    >
      <HugeiconsIcon className="size-4" icon={item.icon} strokeWidth={2} />
      {item.label}
    </Link>
  );
}
