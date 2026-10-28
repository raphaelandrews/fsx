import { Link, type LinkProps } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Award01Icon,
  Calendar04Icon,
  CheckmarkBadge01Icon,
  Database01Icon,
  Download01Icon,
  File01Icon,
  Medal01Icon,
  Megaphone01Icon,
  NewsIcon,
  RefreshIcon,
  Route01Icon,
  SchoolIcon,
  User02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

import { Badge } from "@fsx/ui/components/badge";
import { buttonVariants } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

interface Task {
  title: string;
  when: string;
  steps: string[];
  to: LinkProps["to"];
  /** Opens the list's "New …" dialog straight away. */
  create?: boolean;
  action: string;
  icon: IconSvgElement;
  badge?: number;
}

interface Lane {
  label: string;
  hint: string;
  tasks: Task[];
}

export interface BoardCounts {
  pendingRequests: number;
  draftPosts: number;
  openCircuits: number;
}

function lanes(counts: BoardCounts): Lane[] {
  return [
    {
      label: "Set up",
      hint: "Before a competition happens",
      tasks: [
        {
          title: "Add a tournament",
          when: "A tournament is coming up or has just been played and is not on the site yet.",
          steps: [
            "Fill in the name, date, rating type and tier.",
            "Optionally pick the championship it belongs to and a scoring scheme.",
            "Save. Then use the tasks under “After a tournament” to add its results.",
          ],
          to: "/dashboard/tournaments",
          create: true,
          action: "New tournament",
          icon: Medal01Icon,
        },
        {
          title: "Start a circuit season",
          when: "A new year of a circuit begins, such as “Circuito Escolar 2027”.",
          steps: [
            "Create the circuit with its year, type and championship.",
            "Tick the categories it uses, so a wrong category cannot be entered.",
            "Pick a scoring scheme to prefill points.",
            "On its page, add one stage per tournament, in order.",
          ],
          to: "/dashboard/circuits",
          create: true,
          action: "New circuit",
          icon: Route01Icon,
        },
        {
          title: "Add an event to the calendar",
          when: "A date should appear on the site, with its regulations or registration form.",
          steps: [
            "Create the event with its name, dates and place.",
            "Add the links (regulations, registration, results) on its page.",
          ],
          to: "/dashboard/events",
          create: true,
          action: "New event",
          icon: Calendar04Icon,
        },
      ],
    },
    {
      label: "After a tournament",
      hint: "Results, ratings and podiums",
      tasks: [
        {
          title: "Update ratings from a file",
          when: "A tournament ended and you have its Swiss Manager Excel export.",
          steps: [
            "Upload the file. Nothing is saved yet.",
            "Review what it would do. Rows with a problem are listed and skipped.",
            "Import. You can Stop, and Retry any rows that failed.",
            "The same file can also create a brand new tournament; see its template.",
          ],
          to: "/rating-update",
          action: "Open rating update",
          icon: Medal01Icon,
        },
        {
          title: "Add circuit stage results",
          when: "A circuit stage was played and its points must count in the standings.",
          steps: [
            "Open the circuit, then find the stage.",
            "Choose Add results. Enter one category at a time; points are prefilled.",
            "Places 1 to 3 also create the tournament podium.",
          ],
          to: "/dashboard/circuits",
          action: "Choose a circuit",
          icon: Route01Icon,
          badge: counts.openCircuits,
        },
        {
          title: "Record podiums",
          when: "A tournament has medals but no rating import, or a podium is wrong.",
          steps: [
            "Open the tournament.",
            "In its Podiums panel, add several places at once, overall or per category.",
            "Podiums copied from a circuit are read-only. Change the stage result instead.",
          ],
          to: "/dashboard/tournaments",
          action: "Choose a tournament",
          icon: Award01Icon,
        },
        {
          title: "Add School Games results",
          when: "A TV Sergipe edition finished.",
          steps: [
            "Choose Add several, then the edition, age group, sex and modality.",
            "Enter the places and players. Places 1 to 3 also create the podium.",
          ],
          to: "/dashboard/tv-sergipe",
          action: "Open School Games",
          icon: SchoolIcon,
        },
        {
          title: "Finish a circuit season",
          when: "The last stage is done and the champions are known.",
          steps: [
            "Open the circuit and choose Final podiums.",
            "The top 3 per category are stored. Correct ties by hand if the regulation says so.",
            "A finished season is locked until you reopen it.",
          ],
          to: "/dashboard/circuits",
          action: "Choose a circuit",
          icon: Award01Icon,
        },
      ],
    },
    {
      label: "Publish",
      hint: "What visitors read",
      tasks: [
        {
          title: "Write a news post",
          when: "There is news for the home page and the news feed.",
          steps: [
            "Write it and add a photo.",
            "Tick Published to go live now, or also fill Publish at to schedule it.",
            "Use Preview to see it as readers will. Drafts stay hidden.",
          ],
          to: "/dashboard/posts",
          create: true,
          action: "New post",
          icon: NewsIcon,
          badge: counts.draftPosts,
        },
        {
          title: "Publish an announcement",
          when: "The federation issues an official notice (comunicado).",
          steps: [
            "Enter the year, number and text.",
            "Link the player it is about, so it shows on their profile.",
          ],
          to: "/dashboard/announcements",
          create: true,
          action: "New announcement",
          icon: Megaphone01Icon,
        },
        {
          title: "Refresh the public site",
          when: "You saved something and visitors still see the old version.",
          steps: [
            "Public pages are cached for a few minutes, so waiting also works.",
            "Open Cache and purge to refresh right away.",
          ],
          to: "/dashboard/cache",
          action: "Open cache",
          icon: RefreshIcon,
        },
      ],
    },
    {
      label: "People",
      hint: "Players and their data",
      tasks: [
        {
          title: "Review update requests",
          when: "A player or guardian sent a correction through the site’s form.",
          steps: [
            "Open a request. Each proposed field sits next to its current value.",
            "Approve applies it and marks the player verified. Reject keeps the player as is.",
          ],
          to: "/dashboard/update-requests",
          action: "Review requests",
          icon: CheckmarkBadge01Icon,
          badge: counts.pendingRequests,
        },
        {
          title: "Add a player",
          when: "Someone plays for the first time and is not registered.",
          steps: [
            "Check the player is not already listed. Search first to avoid duplicates.",
            "Fill in the name, sex, club and IDs. Birth year is optional.",
          ],
          to: "/dashboard/players",
          create: true,
          action: "New player",
          icon: User02Icon,
        },
        {
          title: "Merge duplicate players",
          when: "The same person was registered twice.",
          steps: [
            "Open one of the two records and choose Merge with…",
            "Check which record is kept (the lowest ID) and type “merge” to confirm.",
            "It cannot be undone, and it is refused if both have a result in the same tournament.",
          ],
          to: "/dashboard/players",
          action: "Choose a player",
          icon: UserGroupIcon,
        },
        {
          title: "Fix a wrong rating",
          when: "A tournament result or a player’s rating is wrong.",
          steps: [
            "Open the player and find Rating history.",
            "Correct or remove the result. The current rating follows.",
            "If you edited a rating by hand, use Rebuild ratings.",
          ],
          to: "/dashboard/players",
          action: "Choose a player",
          icon: File01Icon,
        },
      ],
    },
  ];
}

export const SAFETY_LINKS: { title: string; description: string; to: LinkProps["to"]; icon: IconSvgElement }[] = [
  { title: "Backup", description: "Export or restore the database.", to: "/dashboard/backup", icon: Download01Icon },
  { title: "History", description: "Who changed what, and the values before and after.", to: "/dashboard/history", icon: File01Icon },
  { title: "Swiss Manager export", description: "Player data for the pairing software.", to: "/dashboard/swiss-manager", icon: Database01Icon },
];

function Steps({ steps }: { steps: string[] }) {
  return (
    <details className="group mt-3 text-sm">
      <summary className="w-fit cursor-pointer select-none rounded-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring">
        How it works
      </summary>
      <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-muted-foreground marker:font-medium marker:text-foreground">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </details>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <article className="flex flex-col rounded-lg bg-background p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
          <HugeiconsIcon className="size-4" icon={task.icon} strokeWidth={2} aria-hidden />
        </span>
        <h3 className="font-semibold text-base leading-tight">{task.title}</h3>
        {task.badge ? (
          <Badge className="ml-auto tabular-nums" variant="secondary">
            {task.badge}
          </Badge>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{task.when}</p>
      <Steps steps={task.steps} />
      <Link
        to={task.to}
        search={task.create ? ({ novo: true } as never) : undefined}
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "mt-4 w-full justify-center")}
      >
        {task.action}
      </Link>
    </article>
  );
}

export function TaskBoard({ counts }: { counts: BoardCounts }) {
  return (
    <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-4">
      {lanes(counts).map((lane) => (
        <section key={lane.label} aria-labelledby={`lane-${lane.label}`} className="flex flex-col gap-3 rounded-2xl bg-muted p-2">
          <div className="px-2 pt-2">
            <h2 id={`lane-${lane.label}`} className="flex items-center gap-2 font-bold text-base">
              {lane.label}
              <Badge variant="outline">{lane.tasks.length}</Badge>
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">{lane.hint}</p>
          </div>
          {lane.tasks.map((task) => (
            <TaskCard key={task.title} task={task} />
          ))}
        </section>
      ))}
    </div>
  );
}
