import { HeaderNavigationDrawer } from "@/components/header-navigation-drawer";
import { MainNav } from "@/components/main-nav";
import { ModeToggle } from "@/components/mode-toggle";


export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-2">
      
          <nav className="flex items-center">
            <ModeToggle />
            <HeaderNavigationDrawer />
          </nav>
        </div>
      </div>
    </header>
  );
}
