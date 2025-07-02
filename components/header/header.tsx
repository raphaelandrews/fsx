import { MainNav } from "./main-nav";
import { HeaderNavigationDrawer } from "./header-navigation-drawer";
import { CommandMenu } from "@/components/command-menu";
import { ModeSwitcher } from "@/components/mode-switcher";
import { UpdateRegister } from "@/components/update-register";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { InstagramIcon, MailIcon } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="!max-w-[1280px] container flex h-14 items-center">
        <MainNav />
        <div className="ml-auto flex items-center gap-2 md:flex-1 md:justify-end">
          <div className="flex w-full flex-1 md:w-auto md:flex-none">
            <CommandMenu />
          </div>
          <Separator className="!w-0.5 !h-4 ml-2" orientation="vertical" />

          <UpdateRegister />

          <Separator
            className="!w-0.5 !h-4 hidden sm:block"
            orientation="vertical"
          />

          <Button size="sm" variant="ghost" className="hidden sm:block p-2">
            <a
              href="https://www.instagram.com/xadrezsergipe/"
              target="_blank"
              rel="noopener"
            >
              <InstagramIcon size={16} />
              <span className="sr-only">Instagram</span>
            </a>
          </Button>

          <Separator
            className="!w-0.5 !h-4 hidden sm:block"
            orientation="vertical"
          />

          <Button size="sm" variant="ghost" className="hidden sm:block p-2">
            <a
              href="mailto:fsx.presidente@gmail.com"
              target="_blank"
              rel="noopener"
            >
              <MailIcon size={16} />
              <span className="sr-only">Email</span>
            </a>
          </Button>

          <Separator className="!w-0.5 !h-4" orientation="vertical" />

          <ModeSwitcher />
          <Separator className="!w-0.5 !h-4 lg:hidden" orientation="vertical" />
          <HeaderNavigationDrawer />
        </div>
      </div>
    </header>
  );
}
