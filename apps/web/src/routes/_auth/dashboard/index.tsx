import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon } from "@hugeicons/core-free-icons";

import { buttonVariants } from "@fsx/ui/components/button";

import { useTRPC } from "@/lib/trpc";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SAFETY_LINKS, TaskBoard } from "@/components/admin/task-board";

export const Route = createFileRoute("/_auth/dashboard/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard - FSX" },
      { name: "description", content: "Sergipe Chess Federation admin dashboard" },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.stats.counts.queryOptions()),
  component: RouteComponent,
});

const GLOSSARY: [string, string][] = [
  ["Championship", "A recurring competition (for example the Sergipano). It groups tournaments, cups and circuit seasons."],
  ["Tournament", "One event on one date. It holds rating results and podiums."],
  ["Circuit", "One season of stages. Each stage is linked to a tournament, and points add up across stages."],
  ["Category", "Where a result counts, such as Sub 10 Feminino or Master. Set up once, used everywhere."],
  ["Scoring scheme", "Points by place (10, 8, 6…). It prefills points; each result can still be changed."],
  ["Podium", "A medal place in a tournament. Many are created for you by circuit and School Games results."],
];

function RouteComponent() {
  const trpc = useTRPC();
  const { data: counts } = useSuspenseQuery(trpc.stats.counts.queryOptions());

  const attention: { text: string; to: "/dashboard/update-requests" | "/dashboard/posts" | "/dashboard/circuits"; action: string }[] = [
    ...(counts.pendingRequests > 0
      ? [{ text: `${counts.pendingRequests} update ${counts.pendingRequests === 1 ? "request is" : "requests are"} waiting for review.`, to: "/dashboard/update-requests" as const, action: "Review" }]
      : []),
    ...(counts.draftPosts > 0
      ? [{ text: `${counts.draftPosts} ${counts.draftPosts === 1 ? "post is" : "posts are"} not published (drafts or scheduled).`, to: "/dashboard/posts" as const, action: "Open posts" }]
      : []),
    ...(counts.openCircuits > 0
      ? [{ text: `${counts.openCircuits} circuit ${counts.openCircuits === 1 ? "season is" : "seasons are"} still in progress.`, to: "/dashboard/circuits" as const, action: "Open circuits" }]
      : []),
  ];

  return (
    <div>
      <AdminPageHeader
        title="What do you want to do?"
        description="Pick a task. Each card says when to use it and what to expect; “How it works” lists the steps."
      />

      {attention.length > 0 ? (
        <section aria-labelledby="attention" className="mb-6 rounded-2xl bg-muted p-4">
          <h2 id="attention" className="flex items-center gap-2 font-bold text-base">
            <HugeiconsIcon className="size-5 text-warning-foreground" icon={Alert02Icon} strokeWidth={2} aria-hidden />
            Needs your attention
          </h2>
          <ul className="mt-2 divide-y divide-border">
            {attention.map((item) => (
              <li key={item.to} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span>{item.text}</span>
                <Link to={item.to} className={buttonVariants({ variant: "outline", size: "lg" })}>
                  {item.action}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <TaskBoard counts={counts} />

      <section aria-labelledby="safety" className="mt-8">
        <h2 id="safety" className="mb-3 font-bold text-base">
          Safety and records
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {SAFETY_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="flex items-start gap-3 rounded-2xl bg-muted p-4 transition-colors duration-200 ease-out hover:bg-accent">
              <HugeiconsIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" icon={link.icon} strokeWidth={2} aria-hidden />
              <span>
                <span className="block font-semibold leading-tight">{link.title}</span>
                <span className="mt-1 block text-muted-foreground text-sm">{link.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="glossary" className="mt-8">
        <details className="rounded-2xl bg-muted p-4">
          <summary id="glossary" className="cursor-pointer select-none font-bold text-base focus-visible:outline-2 focus-visible:outline-ring">
            How the pieces fit together
          </summary>
          <dl className="mt-3 grid gap-x-8 gap-y-3 text-sm md:grid-cols-2">
            {GLOSSARY.map(([term, meaning]) => (
              <div key={term}>
                <dt className="font-medium">{term}</dt>
                <dd className="text-muted-foreground">{meaning}</dd>
              </div>
            ))}
          </dl>
        </details>
      </section>
    </div>
  );
}
