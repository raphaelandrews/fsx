import { Link } from "@tanstack/react-router";

import { FloatingAside } from "./floating-aside";
import { SearchPlayers } from "./search-players";
import { ThemeSwitcher } from "./theme-switcher";

export function Header() {
  return (
    <header className="relative flex items-center justify-between gap-4 w-full h-14 px-3 shrink-0 sm:h-11 sm:px-2">
      <Link
        to="/"
        aria-label="Home"
        className="rounded transition hover:bg-accent"
      >
        <span className="flex font-bold mt-0.5 px-1.5 py-0.5">FSX</span>
      </Link>
      <div className="flex items-center gap-1.5">
        <SearchPlayers />
        <ThemeSwitcher />
        <FloatingAside />
      </div>
    </header>
  );
}
