import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, CheckmarkBadge01Icon, Notification01Icon } from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@fsx/ui/components/popover";

import { useTRPC } from "@/lib/trpc";

export function NotificationsBell() {
  const trpc = useTRPC();
  const counts = useQuery(trpc.stats.counts.queryOptions()).data;
  const notifications = [
    counts && counts.pendingRequests > 0
      ? {
          key: "update-requests",
          to: "/dashboard/update-requests",
          icon: CheckmarkBadge01Icon,
          title: `${counts.pendingRequests} profile update ${counts.pendingRequests === 1 ? "request" : "requests"} to review`,
          hint: "Players asked to correct their data.",
        }
      : null,
  ].filter((item) => item !== null);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xl"
            className="relative text-muted-foreground"
            aria-label={notifications.length > 0 ? `Notifications, ${notifications.length} new` : "Notifications"}
          />
        }
      >
        <HugeiconsIcon className="size-5" icon={Notification01Icon} strokeWidth={2} aria-hidden />
        {notifications.length > 0 ? (
          <span aria-hidden className="absolute top-2 right-2 size-2.5 rounded-full bg-destructive-fill ring-2 ring-background" />
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)] gap-0 p-2">
        <p className="px-3 py-2 font-bold text-base">Notifications</p>
        {notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-muted-foreground text-sm">You're all caught up.</p>
        ) : (
          <ul>
            {notifications.map((item) => (
              <li key={item.key}>
                <Link
                  to={item.to}
                  className="group flex items-center gap-3 rounded-md p-3 outline-none transition-colors duration-200 ease-out hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <HugeiconsIcon icon={item.icon} className="size-4" strokeWidth={2} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-base">{item.title}</span>
                    <span className="block text-muted-foreground text-sm">{item.hint}</span>
                  </span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
