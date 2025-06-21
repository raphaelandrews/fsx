import { MainNav } from "./main-nav";
import { HeaderNavigationDrawer } from "./header-navigation-drawer";
import { CommandMenu } from "@/components/command-menu";
import { ModeSwitcher } from "@/components/mode-switcher";
import { UpdateRegister } from "@/components/update-register";
import { Separator } from "@/components/ui/separator";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 !max-w-[1280px] items-center">
        <MainNav />
        <div className="ml-auto flex items-center gap-2 md:flex-1 md:justify-end">
          <div className="flex w-full flex-1 md:w-auto md:flex-none">
            <CommandMenu />
          </div>
          <Separator className="ml-2 !w-0.5 !h-4" orientation="vertical" />
          <UpdateRegister />
          <Separator className="!w-0.5 !h-4" orientation="vertical" />
          <ModeSwitcher />
          <Separator className="!w-0.5 !h-4 lg:hidden" orientation="vertical" />
          <HeaderNavigationDrawer />
        </div>
      </div>
    </header>
  );
}
