import { MainNav } from "~/components/main-nav";
import { HeaderNavigationDrawer } from "~/components/header-navigation-drawer";
import { SearchPlayers } from "~/components/search-players";
import { ModeToggle } from "~/components/mode-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-lg">
      <div className="container flex h-14 max-w-screen-2xl items-center gap-4 px-4">
        <MainNav />

        <div className="flex flex-1 items-center justify-end gap-2">
          <SearchPlayers />
          <nav className="flex items-center gap-2">
            <ModeToggle />
            <HeaderNavigationDrawer />
          </nav>
        </div>
      </div>
    </header>
  );
}
