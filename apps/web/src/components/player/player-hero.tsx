import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";

import { Avatar, AvatarFallback, AvatarImage } from "@fsx/ui/components/avatar";
import { Badge } from "@fsx/ui/components/badge";
import { buttonVariants } from "@fsx/ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@fsx/ui/components/popover";
import { cn } from "@fsx/ui/lib/utils";

import { avatarGradient, avatarGradientFor } from "@/components/avatar-gradient";
import { championshipIcon } from "@/components/gamification/championship-icons";
import { PlayerLevel } from "@/components/gamification/player-level";
import { TIER_CLASSES } from "@/components/gamification/tier";
import { VerifiedBadge } from "@/components/player/verified-badge";
import type { ClubStanding, PlayerStatsResult } from "@/components/player/types";
import { avatarImage } from "@/lib/media-image";

import type { PlayerById } from "./player-profile";

const TITLE_TIER_BADGES = { 1: "bronze", 2: "silver", 3: "gold", 4: "platinum" } as const;

export function PlayerHero({
  player,
  level,
  titleEmblems,
  internalTitleShortName,
  clubStanding,
}: {
  player: PlayerById;
  level: PlayerStatsResult["level"];
  titleEmblems: { title: { name: string; shortName: string; tier?: number | null; type?: string | null } }[];
  internalTitleShortName: string | undefined;
  clubStanding: ClubStanding | null;
}) {
  const managementRole = player.playersToRoles?.find((role) => role.role.type === "management");
  const refereeRole = player.playersToRoles?.find((role) => role.role.type === "referee");
  const defending = player.defendingChampions ?? [];

  return (
    <header className="flex flex-col items-center gap-3 px-4 pt-12 pb-4 text-center">
      <Avatar className="size-24 after:border-0 after:mix-blend-normal">
        <AvatarImage alt={player.name} {...avatarImage(player.imageUrl, 96)} />
        <AvatarFallback className={avatarGradient(player.id)} />
      </Avatar>

      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">
            {internalTitleShortName && <span className="mr-1.5 text-warning-text">{internalTitleShortName}</span>}
            {player.nickname || player.name}
          </h1>
          <VerifiedBadge playerId={player.id} roles={player.playersToRoles ?? []} verified={player.verified ?? false} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-muted-foreground text-sm">
          {player.club &&
            (player.club.id ? (
              <Link to="/clubes/$id" params={{ id: player.club.id }} className="inline-flex items-center gap-1.5 hover:text-foreground hover:underline">
                <ClubLogo club={player.club} />
                {player.club.name}
                {clubStanding?.rank.rapid && <span className="tabular-nums">· #{clubStanding.rank.rapid} entre os clubes</span>}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <ClubLogo club={player.club} />
                {player.club.name}
              </span>
            ))}
          {player.location && (
            <span className="inline-flex items-center gap-1.5">
              {player.location.flagUrl && (
                <img alt="" className="size-4 rounded object-contain" decoding="async" height={16} loading="lazy" src={player.location.flagUrl} width={16} />
              )}
              {player.location.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", player.active ? "bg-success" : "bg-destructive-fill")} aria-hidden />
            {player.active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      {(titleEmblems.length > 0 || managementRole || refereeRole || defending.length > 0) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {titleEmblems.map(({ title }) => (
            <Popover key={title.name}>
              <PopoverTrigger
                aria-label={title.name}
                className={cn(
                  "rounded-md px-2 py-0.5 font-semibold text-xs outline-offset-2 transition-[scale] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.96]",
                  TIER_CLASSES[TITLE_TIER_BADGES[(title.tier ?? 1) as keyof typeof TITLE_TIER_BADGES] ?? "bronze"],
                )}
              >
                <span aria-hidden>{title.shortName}</span>
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-64 gap-0.5 p-2 text-sm">
                <p className="font-medium">{title.name}</p>
                {title.type && <p className="text-muted-foreground">{title.type === "internal" ? "Titulação FSX" : "Titulação CBX/FIDE"}</p>}
              </PopoverContent>
            </Popover>
          ))}
          {defending.map(({ championshipId, championship }) => (
            <Badge key={championshipId} variant="outline" className="h-6 px-2.5">
              <HugeiconsIcon icon={championshipIcon(championshipId)} aria-hidden />
              Atual campeão(ã) · {championship.name}
            </Badge>
          ))}
          {managementRole && <Badge variant="secondary">{managementRole.role.name}</Badge>}
          {refereeRole && <Badge variant="default">{refereeRole.role.name}</Badge>}
        </div>
      )}

      <PlayerLevel level={level} />

      <Link to="/comparar" search={{ a: player.id }} className={buttonVariants({ variant: "secondary", size: "lg" })}>
        <HugeiconsIcon icon={UserGroupIcon} data-icon="inline-start" aria-hidden />
        Comparar com outro jogador
      </Link>
    </header>
  );
}

function ClubLogo({ club }: { club: NonNullable<PlayerById["club"]> }) {
  return club.logoUrl ? (
    <img alt="" className="size-5 shrink-0 rounded object-contain" decoding="async" height={20} loading="lazy" src={club.logoUrl} width={20} />
  ) : (
    <span className={cn("size-5 shrink-0 rounded", avatarGradientFor(club.name))} aria-hidden />
  );
}

export function PlayerJumpNav({ sections }: { sections: { id: string; label: string }[] }) {
  if (sections.length < 3) return null;
  return (
    <nav
      aria-label="Seções do perfil"
      className="sticky top-0 z-10 -mx-3 mb-4 flex gap-1 overflow-x-auto bg-background/90 px-3 py-2 sm:-mx-4 sm:px-4 backdrop-blur [scrollbar-width:none] sm:justify-center"
    >
      {sections.map(({ id, label }) => (
        <a key={id} href={`#${id}`} className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "shrink-0")}>
          {label}
        </a>
      ))}
    </nav>
  );
}
