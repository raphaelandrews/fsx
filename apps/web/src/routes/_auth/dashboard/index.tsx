import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Award01Icon,
  Calendar04Icon,
  ChampionIcon,
  Database01Icon,
  Download01Icon,
  EllipsisIcon,
  Medal01Icon,
  Megaphone01Icon,
  NewsIcon,
  Route01Icon,
  SchoolIcon,
  User02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

import { Card, CardContent } from "@fsx/ui/components/card";
import { Badge } from "@fsx/ui/components/badge";
import { cn } from "@fsx/ui/lib/utils";

import { useTRPC } from "@/utils/trpc";
import { AdminPageHeader } from "@/components/admin/page-header";
import { avatarGradient } from "@/components/avatar-gradient";

export const Route = createFileRoute("/_auth/dashboard/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard - FSX" },
      { name: "description", content: "Sergipe Chess Federation admin dashboard" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(context.trpc.players.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.posts.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.announcements.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.events.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.tournaments.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.circuits.listSimple.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.tvSergipe.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.clubs.list.queryOptions()),
    ]);
  },
  component: RouteComponent,
});

type BoardItem = {
  title: string;
  to: string;
  icon: IconSvgElement;
  description: string;
  count?: number;
  tag: string;
  statusTone: string;
};

type BoardColumn = {
  label: string;
  icon: IconSvgElement;
  tone: string;
  items: BoardItem[];
};

function RouteComponent() {
  const trpc = useTRPC();

  const players = useSuspenseQuery(trpc.players.list.queryOptions());
  const posts = useSuspenseQuery(trpc.posts.list.queryOptions());
  const announcements = useSuspenseQuery(trpc.announcements.list.queryOptions());
  const events = useSuspenseQuery(trpc.events.list.queryOptions());
  const tournaments = useSuspenseQuery(trpc.tournaments.list.queryOptions());
  const circuits = useSuspenseQuery(trpc.circuits.listSimple.queryOptions());
  const tvSergipe = useSuspenseQuery(trpc.tvSergipe.list.queryOptions());
  const clubs = useSuspenseQuery(trpc.clubs.list.queryOptions());

  const columns: BoardColumn[] = [
    {
      label: "Content",
      icon: NewsIcon,
      tone: "text-amber-500",
      items: [
        { title: "Posts", to: "/dashboard/posts", icon: NewsIcon, description: "Manage site posts.", count: posts.data.length, tag: "Content", statusTone: "text-amber-500" },
        { title: "Announcements", to: "/dashboard/announcements", icon: Megaphone01Icon, description: "Official announcements.", count: announcements.data.length, tag: "Content", statusTone: "text-amber-500" },
        { title: "Events", to: "/dashboard/events", icon: Calendar04Icon, description: "Official events.", count: events.data.length, tag: "Content", statusTone: "text-amber-500" },
      ],
    },
    {
      label: "Competition",
      icon: Route01Icon,
      tone: "text-sky-500",
      items: [
        { title: "Tournaments", to: "/dashboard/tournaments", icon: Medal01Icon, description: "Official tournaments.", count: tournaments.data.length, tag: "Competition", statusTone: "text-sky-500" },
        { title: "Circuits", to: "/dashboard/circuits", icon: Route01Icon, description: "Chess circuits.", count: circuits.data.length, tag: "Competition", statusTone: "text-sky-500" },
        { title: "TV Sergipe", to: "/dashboard/tv-sergipe", icon: SchoolIcon, description: "School games results.", count: tvSergipe.data.length, tag: "Competition", statusTone: "text-sky-500" },
      ],
    },
    {
      label: "Players",
      icon: UserGroupIcon,
      tone: "text-emerald-500",
      items: [
        { title: "Players", to: "/dashboard/players", icon: UserGroupIcon, description: "Manage athletes.", count: players.data.length, tag: "Players", statusTone: "text-emerald-500" },
        { title: "Clubs", to: "/dashboard/clubs", icon: User02Icon, description: "Member clubs.", count: clubs.data.length, tag: "Players", statusTone: "text-emerald-500" },
        { title: "Titles", to: "/dashboard/titles", icon: Award01Icon, description: "Chess titles.", tag: "Players", statusTone: "text-emerald-500" },
      ],
    },
    {
      label: "System",
      icon: Database01Icon,
      tone: "text-violet-500",
      items: [
        { title: "Rating Update", to: "/rating-update", icon: Medal01Icon, description: "Recompute ratings per round.", tag: "System", statusTone: "text-violet-500" },
        { title: "Swiss Manager", to: "/dashboard/swiss-manager", icon: Download01Icon, description: "Export in CSV format.", tag: "System", statusTone: "text-violet-500" },
        { title: "Championships", to: "/dashboard/championships", icon: ChampionIcon, description: "Manage championships.", tag: "System", statusTone: "text-violet-500" },
      ],
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Overview"
        description="A snapshot of the federation's admin areas."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <div key={column.label} className="flex flex-col gap-3">
            <ColumnHeader column={column} />
            {column.items.map((item) => (
              <ModuleCard key={item.title} item={item} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ColumnHeader({ column }: { column: BoardColumn }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl px-3 py-2.5">
      <div className="flex items-center gap-2">
        <HugeiconsIcon className={cn("size-4", column.tone)} icon={column.icon} strokeWidth={2} />
        <span className="text-sm font-semibold">{column.label}</span>
        <Badge className="rounded-sm" variant="secondary">
          {column.items.length}
        </Badge>
      </div>
      <HugeiconsIcon className="size-4 text-muted-foreground/60" icon={EllipsisIcon} strokeWidth={2} />
    </div>
  );
}

function ModuleCard({ item }: { item: BoardItem }) {
  return (
    <Link to={item.to}>
      <Card
        className="group transition-all hover:border-foreground/20 hover:shadow-md"
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <HugeiconsIcon className={cn("mt-0.5 size-4 shrink-0", item.statusTone)} icon={item.icon} strokeWidth={2} />
            <h3 className="font-semibold leading-tight">{item.title}</h3>
            {typeof item.count === "number" ? (
              <Badge className="ml-auto rounded-full px-1.5 font-normal" variant="secondary">
                {item.count}
              </Badge>
            ) : null}
          </div>

          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {item.description}
          </p>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {item.title.replace(/\s+/g, "-").slice(0, 8).toUpperCase()}
              </span>
              <Badge className="rounded-sm" variant="outline">
                {item.tag}
              </Badge>
            </div>
            <span
              aria-hidden
              className={cn("size-6 rounded-full", avatarGradient(item.title.length))}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
