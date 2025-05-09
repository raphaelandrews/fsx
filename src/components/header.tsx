import { Link } from "@tanstack/react-router";

import { Breadcrumbs } from "./breadcrumbs";
import { AsideMenu } from "./aside-menu";
import { SearchPlayers } from "./search-players";
import { ThemeSwitcher } from "./theme-switcher";

export function Header() {
  return (
    <header className="relative flex flex-col w-full shrink-0">
      <div className="flex items-center justify-between gap-4 h-14 px-3 sm:h-11 sm:px-2">
        <div className="flex items-center gap-1.5">
          <Link
            to="/"
            aria-label="Home"
            className="rounded transition hover:bg-accent"
          >
            <span className="flex font-bold mt-0.5 px-1.5 py-0.5">FSX</span>
          </Link>
          <Breadcrumbs />
        </div>
        <div className="flex items-center gap-1.5">
          <SearchPlayers />
          <ThemeSwitcher />
          <AsideMenu />
        </div>
      </div>
    </header>
  );
}
