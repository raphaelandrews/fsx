import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardLayout,
});

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/dashboard/players", label: "Players" },
  { to: "/dashboard/posts", label: "Posts" },
  { to: "/dashboard/announcements", label: "Announcements" },
  { to: "/dashboard/events", label: "Events" },
  { to: "/dashboard/tournaments", label: "Tournaments" },
  { to: "/dashboard/championships", label: "Championships" },
  { to: "/dashboard/clubs", label: "Clubs" },
  { to: "/dashboard/locations", label: "Locations" },
  { to: "/dashboard/links", label: "Links" },
  { to: "/dashboard/circuits", label: "Circuits" },
  { to: "/dashboard/school-results", label: "School Results" },
  { to: "/dashboard/tournament-podiums", label: "Podiums" },
  { to: "/dashboard/titles", label: "Titles" },
  { to: "/dashboard/roles", label: "Roles" },
  { to: "/dashboard/norms", label: "Norms" },
  { to: "/dashboard/insignias", label: "Insignias" },
  { to: "/rating-update", label: "Rating Update" },
  { to: "/dashboard/swiss-manager", label: "Swiss Manager" },
  { to: "/dashboard/cache", label: "Cache" },
  { to: "/dashboard/backup", label: "Backup" },
  { to: "/dashboard/user", label: "User" },
] as const;

function DashboardLayout() {
  return (
    <div className="flex min-h-[60vh]">
      <aside className="w-56 shrink-0 border-border/40 border-r p-4">
        <h2 className="mb-3 font-semibold text-sm">Admin</h2>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-accent/50 [&.active]:text-foreground [&.active]:font-medium"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
