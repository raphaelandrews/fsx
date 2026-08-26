import { MainNav } from "./main-nav"
import { HeaderNavigationDrawer } from "./header-navigation-drawer"
import { CommandMenu } from "../command-menu"
import { UpdateRegister } from "../update-register"
import { ModeSwitcher } from "../mode-switcher"

export function Header() {
  return (
    <header className="w-full border-border/40 bg-background">
      <div className="container relative max-w-5xl flex h-16 items-center">
        <MainNav />
        <div className="flex items-center gap-2 md:justify-end">
          <div className="flex w-full flex-1 md:w-auto md:flex-none">
            <CommandMenu />
          </div>

          <UpdateRegister />
          <ModeSwitcher />
          <HeaderNavigationDrawer />
        </div>
      </div>
    </header>
  )
}
