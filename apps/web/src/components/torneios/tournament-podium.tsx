import { Link } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@fsx/api/routers/index";
import { Avatar, AvatarFallback, AvatarImage } from "@fsx/ui/components/avatar";
import { cn } from "@fsx/ui/lib/utils";

import { avatarGradient } from "@/components/avatar-gradient";
import { Medal } from "@/components/gamification/medal";
import { avatarImage } from "@/lib/media-image";

type Podium = inferRouterOutputs<AppRouter>["tournaments"]["byId"]["tournamentPodiums"][number];
type Result = inferRouterOutputs<AppRouter>["tournaments"]["results"][number];

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

function Place({ place }: { place: number }) {
  return place >= 1 && place <= 3 ? (
    <Medal place={place as 1 | 2 | 3} />
  ) : (
    <span className="inline-flex min-w-9 justify-center font-medium text-muted-foreground tabular-nums">{place}º</span>
  );
}

function Change({ result, className }: { result: Result | undefined; className?: string }) {
  if (!result) return null;
  return (
    <span className={cn("ml-auto flex shrink-0 items-baseline gap-2 tabular-nums", className)}>
      <span className="font-medium">{result.oldRating + result.variation}</span>
      <span className={cn("font-semibold text-sm", result.variation >= 0 ? "text-success" : "text-destructive")}>
        {signed(result.variation)}
      </span>
    </span>
  );
}

function PodiumCard({ podium, result }: { podium: Podium; result: Result | undefined }) {
  const first = podium.place === 1;
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-muted p-3 sm:flex-col sm:gap-2 sm:px-3 sm:text-center",
        first ? "sm:order-2 sm:pt-7 sm:pb-5" : "sm:py-4",
        podium.place === 2 && "sm:order-1",
        podium.place === 3 && "sm:order-3",
      )}
    >
      <Place place={podium.place} />
      <Avatar className={first ? "size-14 sm:size-20" : "size-12 sm:size-14"}>
        <AvatarImage alt="" {...avatarImage(podium.player.imageUrl, first ? 80 : 56)} />
        <AvatarFallback className={avatarGradient(podium.player.id)} />
      </Avatar>
      <Link
        to="/jogadores/$id"
        params={{ id: podium.player.id }}
        className={cn("min-w-0 flex-1 text-balance hover:underline sm:flex-none", first ? "font-semibold text-lg" : "font-medium text-base")}
      >
        {podium.player.nickname || podium.player.name}
      </Link>
      <Change result={result} className="sm:ml-0" />
    </li>
  );
}

/** The overall classification first (podium cards with the champion in the middle, then the rest), then one tile per category. */
export function TournamentPodium({ podiums, results }: { podiums: Podium[]; results: Result[] }) {
  if (podiums.length === 0) return null;

  const resultOf = new Map(results.map((result) => [result.playerId, result]));
  const groups = new Map<string, Podium[]>();
  for (const podium of podiums) {
    const key = podium.category ?? "";
    groups.set(key, [...(groups.get(key) ?? []), podium]);
  }
  const overall = groups.get("");
  const categories = [...groups].filter(([category]) => category !== "").sort(([a], [b]) => a.localeCompare(b, "pt-BR"));
  // Teams can share a place; the three-card podium only fits one player per medal.
  const top = overall?.filter((podium) => podium.place <= 3) ?? [];
  const asCards = top.length === 3 && new Set(top.map((podium) => podium.place)).size === 3;
  const rest = asCards ? (overall ?? []).filter((podium) => podium.place > 3) : (overall ?? []);

  return (
    <div className="grid gap-4">
      {overall && (
        <section aria-labelledby="podium-overall">
          <h3 id="podium-overall" className="mb-2 px-1 font-semibold text-lg">
            Classificação geral
          </h3>
          {asCards && (
            <ol className="grid items-end gap-2 sm:grid-cols-3 sm:gap-3">
              {[...top].sort((a, b) => a.place - b.place).map((podium) => (
                <PodiumCard key={podium.id} podium={podium} result={resultOf.get(podium.player.id)} />
              ))}
            </ol>
          )}
          {rest.length > 0 && (
            <ol className={cn("divide-y divide-border rounded-2xl bg-muted px-3 sm:px-4", asCards && "mt-3")} start={asCards ? 4 : 1}>
              {rest.map((podium) => (
                <li key={podium.id} className="flex items-center gap-3 py-2.5">
                  <Place place={podium.place} />
                  <Avatar className="size-10">
                    <AvatarImage alt="" {...avatarImage(podium.player.imageUrl, 40)} />
                    <AvatarFallback className={avatarGradient(podium.player.id)} />
                  </Avatar>
                  <Link to="/jogadores/$id" params={{ id: podium.player.id }} className="min-w-0 truncate font-medium text-base hover:underline">
                    {podium.player.nickname || podium.player.name}
                  </Link>
                  <Change result={resultOf.get(podium.player.id)} />
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      {categories.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map(([category, rows]) => (
            <section key={category} aria-label={category} className="rounded-2xl bg-muted p-3 sm:p-4">
              <h3 className="mb-2 px-1 font-semibold text-base">{category}</h3>
              <ol className="divide-y divide-border">
                {rows.map((podium) => (
                  <li key={podium.id} className="flex items-center gap-2.5 py-2">
                    <Place place={podium.place} />
                    <Link to="/jogadores/$id" params={{ id: podium.player.id }} className="min-w-0 truncate hover:underline">
                      {podium.player.nickname || podium.player.name}
                    </Link>
                    <Change result={resultOf.get(podium.player.id)} />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
