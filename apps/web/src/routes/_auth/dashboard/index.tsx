import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  NewsIcon,
  Megaphone01Icon,
  Calendar04Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

import { Card, CardContent } from "@fsx/ui/components/card";
import { cn } from "@fsx/ui/lib/utils";

import { useTRPC } from "@/utils/trpc";
import { AdminPageHeader } from "@/components/admin/page-header";

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
    ]);
  },
  component: RouteComponent,
});

type Stat = {
  label: string;
  value: number;
  icon: IconSvgElement;
  to: string;
  tone: string;
};

function RouteComponent() {
  const trpc = useTRPC();

  const { data: players = [] } = useSuspenseQuery(trpc.players.list.queryOptions());
  const { data: posts = [] } = useSuspenseQuery(trpc.posts.list.queryOptions());
  const { data: announcements = [] } = useSuspenseQuery(trpc.announcements.list.queryOptions());
  const { data: events = [] } = useSuspenseQuery(trpc.events.list.queryOptions());

  const stats: Stat[] = [
    { label: "Playeres", value: players.length, icon: UserGroupIcon, to: "/dashboard/players", tone: "text-sky-600" },
    { label: "Posts", value: posts.length, icon: NewsIcon, to: "/dashboard/posts", tone: "text-violet-600" },
    { label: "Comunicados", value: announcements.length, icon: Megaphone01Icon, to: "/dashboard/announcements", tone: "text-amber-600" },
    { label: "Eventos", value: events.length, icon: Calendar04Icon, to: "/dashboard/events", tone: "text-emerald-600" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Overview"
        description="Summary of the federation's activity."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-5">
              <Link to={stat.to} className="group flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 font-semibold text-3xl tracking-tight tabular-nums">
                    {stat.value}
                  </p>
                </div>
                <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted", stat.tone)}>
                  <HugeiconsIcon className="size-5" icon={stat.icon} strokeWidth={2} />
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <QuickLink
          title="Rating Update"
          description="Import results and recompute ratings per round."
          to="/rating-update"
        />
        <QuickLink
          title="Swiss Manager"
          description="Export results in CSV format."
          to="/dashboard/swiss-manager"
        />
        <QuickLink
          title="Cache"
          description="Invalidate public caches and reset sequences."
          to="/dashboard/cache"
        />
        <QuickLink
          title="Backup"
          description="Download a copy of the federation's data."
          to="/dashboard/backup"
        />
      </div>
    </div>
  );
}

function QuickLink({
  title,
  description,
  to,
}: {
  title: string;
  description: string;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="group h-full transition-colors hover:border-foreground/20">
        <CardContent className="flex items-center justify-between gap-3 p-5">
          <div>
            <p className="font-medium">{title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          </div>
          <HugeiconsIcon
            className="size-5 shrink-0 text-primary-foreground transition-transform group-hover:translate-x-0.5"
            icon={ArrowRight01Icon}
            strokeWidth={2}
          />
        </CardContent>
      </Card>
    </Link>
  );
}
