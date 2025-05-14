import { SearchPlayers } from "./search-players";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { MainNav } from "./main-nav";
import { HeaderNavigationDrawer } from "./header-navigation-drawer";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 !max-w-[1280px] items-center">
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-2">
          <SearchPlayers />
          <nav className="flex items-center">
            <ThemeSwitcher />
            <HeaderNavigationDrawer />
          </nav>
        </div>
      </div>
    </header>
  );
}
