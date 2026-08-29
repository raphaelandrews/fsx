import { useState } from "react";
import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@fsx/ui/components/sheet";
import { cn } from "@fsx/ui/lib/utils";

import { Logo } from "@/components/logo";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardLayout,
});

type NavItem = { to: string; label: string; section?: string };

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Visão geral",
    items: [
      { to: "/dashboard", label: "Dashboard" },
      { to: "/rating-update", label: "Atualização de Elo" },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { to: "/dashboard/posts", label: "Posts" },
      { to: "/dashboard/announcements", label: "Comunicados" },
      { to: "/dashboard/events", label: "Eventos" },
    ],
  },
  {
    label: "Competição",
    items: [
      { to: "/dashboard/tournaments", label: "Torneios" },
      { to: "/dashboard/championships", label: "Campeonatos" },
      { to: "/dashboard/tournament-podiums", label: "Pódios" },
      { to: "/dashboard/circuits", label: "Circuitos" },
      { to: "/dashboard/tv-sergipe", label: "TV Sergipe" },
    ],
  },
  {
    label: "Atletas",
    items: [
      { to: "/dashboard/players", label: "Jogadores" },
      { to: "/dashboard/titles", label: "Títulos" },
      { to: "/dashboard/roles", label: "Funções" },
      { to: "/dashboard/norms", label: "Normas" },
      { to: "/dashboard/insignias", label: "Insígnias" },
    ],
  },
  {
    label: "Entidades",
    items: [
      { to: "/dashboard/clubs", label: "Clubes" },
      { to: "/dashboard/locations", label: "Localidades" },
      { to: "/dashboard/links", label: "Links" },
    ],
  },
  {
    label: "Sistema",
    items: [
      { to: "/dashboard/swiss-manager", label: "Swiss Manager" },
      { to: "/dashboard/cache", label: "Cache" },
      { to: "/dashboard/backup", label: "Backup" },
      { to: "/dashboard/user", label: "Conta" },
    ],
  },
];

function isActive(pathname: string, to: string): boolean {
  if (to === "/dashboard") return pathname === "/dashboard";
  return pathname === to || pathname.startsWith(`${to}/`);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto p-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          <p className="px-3 pb-2 text-xs font-medium tracking-wide text-muted-foreground/60 uppercase">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.to);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                      active && "bg-accent/60 text-foreground font-semibold",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-border/40 border-r bg-background lg:flex">
      <div className="flex h-16 items-center border-border/40 border-b px-5">
        <Link to="/dashboard" className="font-bold text-lg">
          FSX Admin
        </Link>
      </div>
      <NavLinks />
    </aside>
  );
}

function DashboardLayout() {
  const [onboard, setOnboard] = useState(false);

  return (
    <div className="flex min-h-dvh bg-muted/20">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-border/40 border-b bg-background/95 px-4 backdrop-blur lg:hidden">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold">
            <Logo className="h-7 w-auto" />
            <span className="hidden sm:inline">Admin</span>
          </Link>
          <Sheet open={onboard} onOpenChange={setOnboard}>
            <SheetTrigger render={<Button />}>
              <HugeiconsIcon className="size-5" icon={Menu01Icon} strokeWidth={2} />
              <span className="sr-only">Abrir menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col !w-72 p-0">
              <div className="flex h-16 items-center justify-between border-border/40 border-b px-5">
                <span className="font-bold text-lg">FSX Admin</span>
                <SheetClose render={<Button />}>
                  <HugeiconsIcon className="size-5" icon={Cancel01Icon} strokeWidth={2} />
                  <span className="sr-only">Fechar menu</span>
                </SheetClose>
              </div>
              <SheetTitle className="sr-only">Menu de navegação do admin</SheetTitle>
              <NavLinks onNavigate={() => setOnboard(false)} />
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
