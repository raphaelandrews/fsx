import { MainNav } from "./main-nav"
import { HeaderNavigationDrawer } from "./header-navigation-drawer"
import { LogoutButton } from "@/components/logout-button"
import { ModeSwitcher } from "@/components/mode-switcher"
import { Separator } from "@/components/ui/separator"

export function Header() {
	return (
		<header className="sticky top-0 z-50 w-full border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="!max-w-[1280px] container flex h-14 items-center">
				<MainNav />
				<div className="ml-auto flex items-center gap-2 md:flex-1 md:justify-end">
					<ModeSwitcher />
					<Separator className="!w-0.5 !h-4 lg:hidden" orientation="vertical" />
					<HeaderNavigationDrawer />
					<Separator className="!w-0.5 !h-4" orientation="vertical" />
					<LogoutButton />
				</div>
			</div>
		</header>
	)
}
