import { Link } from "@tanstack/react-router";
import { ThemeSwitcher } from "./theme-switcher";

export function Header() {
  return (
    <header className="flex items-center justify-between gap-3 h-14 px-3 py-2 shrink-0 sm:h-11 sm:px-2">
      <Link
        to="/"
        aria-label="Home"
      >
        <span className="flex font-bold mt-0.5 px-1">FSX</span>
      </Link>
      <ThemeSwitcher/>
    </header>
  );
}
