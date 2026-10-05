import * as React from "react";
import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
  Calendar01Icon,
  Link02Icon,
  InformationCircleIcon,
  Target01Icon,
  BarChartIcon,
  ChartBarLineIcon,
  Analytics01Icon,
  Route01Icon,
  ScrollIcon,
} from "@hugeicons/core-free-icons";

import { columns } from "@/components/sheets/player/columns";
import { DataTable } from "@/components/sheets/player/data-table";

import { Avatar, AvatarFallback, AvatarImage } from "@fsx/ui/components/avatar";
import { Badge } from "@fsx/ui/components/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@fsx/ui/components/popover";
import { Tabs, TabsList, TabsTrigger } from "@fsx/ui/components/tabs";
import { VerifiedBadge } from "@/components/player/verified-badge";
import { Announcement } from "@/components/announcement";
import { TotalRatingChart, VariationChart } from "@/components/player/player-charts";
import { cn } from "@fsx/ui/lib/utils";
import { avatarGradient, avatarGradientFor } from "@/components/avatar-gradient";
import { PlayerLevel } from "@/components/gamification/player-level";
import { championshipIcon, podiumIcon } from "@/components/gamification/championship-icons";
import { TIER_CLASSES, formatIsoDate } from "@/components/gamification/tier";
import { AchievementGrid, Subheading, TrophyCabinet } from "@/components/player/player-achievements";
import { PlayerAnnouncements } from "@/components/player/player-announcements";
import { PlayerCircuits } from "@/components/player/player-circuits";
import { PlayerStats } from "@/components/player/player-stats";
import { byTitleTier } from "@/components/player/title-emblems";
import type { ClubStanding, PlayerAnnouncement, PlayerCircuitSeason, PlayerRanking, PlayerStatsResult } from "@/components/player/types";
import { Movement } from "@/components/gamification/movement";
import { StatTile } from "@/components/gamification/stat-tile";

function FormatPodium(place: number | null | undefined, championshipId: number) {
  const icon = podiumIcon(place, championshipId);
  return icon ? <HugeiconsIcon icon={icon} className="size-5" strokeWidth={1.75} aria-hidden /> : null;
}

const podiumLabel = (podium: { category?: string | null; tournament: { name: string } }) =>
  podium.category ? `${podium.tournament.name} · ${podium.category}` : podium.tournament.name;

function FormatPodiumTitle(place: number | null | undefined) {
  if (place === 1) {
    return "Campeão(ã)";
  }
  if (place === 2) {
    return "Vice-Campeão(ã)";
  }
  if (place === 3) {
    return "3º lugar";
  }
}

const medalButton =
  "inline-flex size-11 items-center justify-center rounded-xl bg-muted text-foreground shadow-[inset_0_0_0_1px_var(--border)] hover:shadow-[inset_0_0_0_1px_var(--muted-foreground)] outline-offset-2 transition-[scale,box-shadow] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.96]";

export interface PlayerById {
  id: number;
  name: string;
  nickname?: string | null;
  imageUrl?: string | null;
  verified?: boolean | null;
  active?: boolean | null;
  classic?: number | null;
  rapid?: number | null;
  blitz?: number | null;
  cbxId?: number | null;
  fideId?: number | null;
  playersToTournaments?: Array<{
    variation: number;
    oldRating: number;
    tournament: {
      name: string;
      ratingType: string;
      championshipId?: number | null;
    };
  }>;
  playersToRoles?: Array<{
    role: {
      type: string;
      name: string;
    };
  }>;
  playersToTitles?: Array<{
    title: {
      type: string;
      shortName: string;
      name: string;
      tier?: number;
    };
  }>;
  tournamentPodiums?: Array<{
    place: number | null;
    category?: string | null;
    tournament: {
      name: string;
      date?: string | null;
      championshipId?: number | null;
      championship?: { name: string } | null;
    };
  }>;
  defendingChampions?: Array<{
    championshipId: number;
    championship: {
      name: string;
    };
  }>;
  club?: {
    id?: number;
    name: string;
    logoUrl?: string | null;
  } | null;
  location?: {
    name: string;
    flagUrl?: string | null;
  } | null;
}

const TITLE_TIER_BADGES = { 1: "bronze", 2: "silver", 3: "gold", 4: "platinum" } as const;

export function PlayerProfile({
  player,
  stats,
  circuitSeasons,
  announcements,
  ranking,
  clubStanding,
}: {
  player: PlayerById;
  clubStanding: ClubStanding | null;
  stats: PlayerStatsResult;
  ranking: PlayerRanking;
  circuitSeasons: PlayerCircuitSeason[];
  announcements: PlayerAnnouncement[];
}) {
  // Championship groups (most titles first) with their podiums newest first;
  // podiums of one-off tournaments close the list.
  const podiumGroups = React.useMemo(() => {
    const groups = new Map<string, NonNullable<PlayerById["tournamentPodiums"]>>();
    for (const podium of player?.tournamentPodiums ?? []) {
      const name = podium.tournament.championship?.name ?? "Outros torneios";
      groups.set(name, [...(groups.get(name) ?? []), podium]);
    }
    return [...groups]
      .map(([name, podiums]) => ({
        name,
        titles: podiums.filter((podium) => podium.place === 1 && !podium.category).length,
        podiums: podiums.sort((a, b) => (b.tournament.date ?? "").localeCompare(a.tournament.date ?? "")),
      }))
      .sort((a, b) =>
        a.name === "Outros torneios" ? 1 : b.name === "Outros torneios" ? -1 : b.titles - a.titles || a.name.localeCompare(b.name, "pt-BR"),
      );
  }, [player?.tournamentPodiums]);

  const titleEmblems = React.useMemo(() => byTitleTier(player?.playersToTitles ?? []), [player?.playersToTitles]);

  const medalCount = Object.values(stats.stats.medals).reduce((sum, m) => sum + m.gold + m.silver + m.bronze, 0);

  const tournaments = React.useMemo(() => {
    return player?.playersToTournaments ? [...player.playersToTournaments].reverse() : [];
  }, [player?.playersToTournaments]);

  const managementRole = React.useMemo(() => {
    return player?.playersToRoles?.find((role) => role.role.type === "management");
  }, [player?.playersToRoles]);

  const refereeRole = React.useMemo(() => {
    return player?.playersToRoles?.find((role) => role.role.type === "referee");
  }, [player?.playersToRoles]);

  const internalTitle = React.useMemo(() => {
    return player?.playersToTitles?.find((title) => title.title.type === "internal");
  }, [player?.playersToTitles]);

  const externalTitle = React.useMemo(() => {
    return player?.playersToTitles?.find((title) => title.title.type === "external");
  }, [player?.playersToTitles]);

  const [selectedRatingType, setSelectedRatingType] = React.useState("rapid");

  return (
    <>
      <div className="relative">
        <div className="px-4 pb-4">
          <div className="mb-4 flex justify-center pt-12">
            <Avatar className="size-24 after:border-0 after:mix-blend-normal">
              <AvatarImage alt={player.name} src={player.imageUrl ?? ""} />
              <AvatarFallback className={avatarGradient(player.id)} />
            </Avatar>
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-semibold tracking-tight">
                {internalTitle && (
                  <span className="text-highlight mr-1.5">{internalTitle.title.shortName}</span>
                )}
                {player.nickname || player.name}
              </h1>
              <VerifiedBadge
                playerId={player.id}
                roles={player.playersToRoles ?? []}
                verified={player.verified ?? false}
              />
            </div>

            <PlayerLevel level={stats.level} />

            <div className="flex flex-wrap items-center justify-center gap-2">
              {titleEmblems.map(({ title }) => (
                <span
                  key={title.name}
                  className={cn(
                    "rounded-md px-2 py-0.5 font-semibold text-xs",
                    TIER_CLASSES[TITLE_TIER_BADGES[(title.tier ?? 1) as keyof typeof TITLE_TIER_BADGES] ?? "bronze"],
                  )}
                  title={title.name}
                >
                  <span aria-hidden>{title.shortName}</span>
                  <span className="sr-only">{title.name}</span>
                </span>
              ))}
              {(managementRole || refereeRole) && (
                <>
                  {managementRole && <Badge variant="secondary">{managementRole.role.name}</Badge>}
                  {refereeRole && <Badge variant="default">{refereeRole.role.name}</Badge>}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <section className="mb-0">
        <Announcement icon={ChartBarLineIcon} label="Ratings" />

        <div className="grid grid-cols-3 gap-2 px-2 sm:gap-4 sm:px-4">
          <RatingBox label="Clássico" value={player.classic} peak={stats.stats.formats.classic?.peak.rating} rank={ranking.classic} />
          <RatingBox label="Rápido" value={player.rapid} peak={stats.stats.formats.rapid?.peak.rating} rank={ranking.rapid} />
          <RatingBox label="Blitz" value={player.blitz} peak={stats.stats.formats.blitz?.peak.rating} rank={ranking.blitz} />
        </div>
      </section>

      {(podiumGroups.length > 0 ||
        medalCount > 0 ||
        stats.achievements.length > 0 ||
        stats.upcoming.length > 0 ||
        (player.defendingChampions && player.defendingChampions?.length > 0)) && (
          <section className="mb-0">
            <Announcement icon={Target01Icon} label="Conquistas" />
            <div className="grid gap-6 px-3 pt-1 pb-4">
              <TrophyCabinet medals={stats.stats.medals} />
              <AchievementGrid achievements={stats.achievements} upcoming={stats.upcoming} />
              {player.defendingChampions && player.defendingChampions.length > 0 && (
                <section aria-labelledby="player-defending">
                  <Subheading id="player-defending">Atual campeão</Subheading>
                  <ul className="flex flex-wrap gap-2">
                    {player.defendingChampions.map(({ championshipId, championship }) => {
                      const label = `Atual campeão(ã) · ${championship.name}`;
                      return (
                        <li key={championshipId}>
                          <Popover>
                            <PopoverTrigger aria-label={label} className={medalButton}>
                              <HugeiconsIcon icon={championshipIcon(championshipId)} className="size-5" strokeWidth={1.75} aria-hidden />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2 text-sm font-medium">{label}</PopoverContent>
                          </Popover>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {podiumGroups.length > 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
                  {podiumGroups.map((group) => (
                    <section
                      key={group.name}
                      aria-label={`Pódios · ${group.name}`}
                      className={cn(group.podiums.length > 4 && "col-span-full")}
                    >
                      <Subheading aside={group.titles > 0 ? `${group.titles} título${group.titles === 1 ? "" : "s"}` : undefined}>
                        {group.name}
                      </Subheading>
                      <ul className="flex flex-wrap gap-2">
                        {group.podiums.map((podium) => (
                          <li key={`${podium.place}-${podium.category ?? ""}-${podium.tournament.name}`}>
                            <Popover>
                              <PopoverTrigger
                                aria-label={`${FormatPodiumTitle(podium.place) ?? "Colocação"}: ${podiumLabel(podium)}`}
                                className={medalButton}
                              >
                                {FormatPodium(podium.place, podium.category ? 0 : (podium.tournament.championshipId ?? 0))}
                              </PopoverTrigger>
                              <PopoverContent className="w-auto max-w-64 gap-0.5 p-2 text-sm">
                                <p className="font-medium">
                                  {FormatPodiumTitle(podium.place)} · {podiumLabel(podium)}
                                </p>
                                {podium.tournament.date && (
                                  <p className="text-muted-foreground tabular-nums">{formatIsoDate(podium.tournament.date)}</p>
                                )}
                              </PopoverContent>
                            </Popover>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

      <section className="mb-0">
        <Announcement icon={InformationCircleIcon} label="Informações" />

        <dl className="flex flex-col divide-y px-3">
          <InfoItem label="Nome Completo" value={player.name} />

          {internalTitle && <InfoItem label="Titulação FSX" value={internalTitle.title.name} />}

          {externalTitle && (
            <InfoItem label="Titulação CBX/FIDE" value={externalTitle.title.name} />
          )}

          {player.club && (
            <InfoItem label="Clube">
              <div className="flex items-center gap-2">
                {player.club.logoUrl ? (
                  <span className="relative flex shrink-0 h-5 w-5 overflow-hidden rounded">
                    <img
                      alt=""
                      decoding="async"
                      height={20}
                      loading="lazy"
                      width={20}
                      className="aspect-square size-full object-contain"
                      src={player.club.logoUrl}
                    />
                  </span>
                ) : (
                  <span className={cn("relative flex shrink-0 h-5 w-5 overflow-hidden rounded", avatarGradientFor(player.club.name))} />
                )}
                {player.club.id ? (
                  <Link to="/clubes/$id" params={{ id: player.club.id }} className="hover:underline">
                    {player.club.name}
                  </Link>
                ) : (
                  <span>{player.club.name}</span>
                )}
                {clubStanding?.rank.rapid && (
                  <span className="text-muted-foreground text-sm">#{clubStanding.rank.rapid} entre os clubes</span>
                )}
              </div>
            </InfoItem>
          )}

          {player.location && (
            <InfoItem label="Localização">
              <div className="flex items-center gap-2">
                {player.location.flagUrl ? (
                  <span className="relative flex shrink-0 size-4 overflow-hidden rounded object-contain">
                    <img
                      alt=""
                      className="aspect-square size-4 rounded object-contain"
                      decoding="async"
                      height={16}
                      loading="lazy"
                      src={player.location.flagUrl}
                      width={16}
                    />
                  </span>
                ) : null}
                <span>{player.location.name}</span>
              </div>
            </InfoItem>
          )}

          <InfoItem label="Status">
            <span className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full", player.active ? "bg-success" : "bg-destructive-fill")} aria-hidden />
              {player.active ? "Ativo" : "Inativo"}
            </span>
          </InfoItem>
        </dl>
      </section>


      {stats.stats.tournamentsPlayed > 0 && (
        <section className="mb-0">
          <Announcement icon={Analytics01Icon} label="Estatísticas" />
          <PlayerStats playerId={player.id} stats={stats.stats} tournaments={stats.tournaments} />
        </section>
      )}

      {circuitSeasons.length > 0 && (
        <section className="mb-0">
          <Announcement icon={Route01Icon} label="Circuitos" />
          <PlayerCircuits seasons={circuitSeasons} />
        </section>
      )}

      {announcements.length > 0 && (
        <section className="mb-0">
          <Announcement icon={ScrollIcon} label="Comunicados" />
          <PlayerAnnouncements announcements={announcements} />
        </section>
      )}

      <section className="mb-0">
        <Announcement icon={Link02Icon} label="IDs" />

        <div className="grid grid-cols-3 gap-2 px-2 sm:gap-4 sm:px-4">
          <IdBox label="ID FSX" value={String(player.id)} />
          <IdBox
            label="ID CBX"
            value={player.cbxId ? String(player.cbxId) : "—"}
            href={player.cbxId ? `https://www.cbx.org.br/jogador/${player.cbxId}` : undefined}
          />
          <IdBox
            label="ID FIDE"
            value={player.fideId ? String(player.fideId) : "—"}
            href={player.fideId ? `https://ratings.fide.com/profile/${player.fideId}` : undefined}
          />
        </div>
      </section>

      {tournaments.length > 0 && (
        <section className="mb-0">
          <Announcement icon={BarChartIcon} label="Performance" />

          <div className="p-4 space-y-6">
            <Tabs value={selectedRatingType} onValueChange={(value) => setSelectedRatingType(value as string)}>
              <div className="flex justify-center">
                <TabsList aria-label="Tipo de rating">
                  <TabsTrigger value="classic">Clássico</TabsTrigger>
                  <TabsTrigger value="rapid">Rápido</TabsTrigger>
                  <TabsTrigger value="blitz">Blitz</TabsTrigger>
                </TabsList>
              </div>
            </Tabs>

            <section aria-labelledby="player-variation">
              <Subheading id="player-variation">Variação de rating</Subheading>
              <VariationChart player={player} selectedRatingType={selectedRatingType} />
            </section>

            <section aria-labelledby="player-evolution">
              <Subheading id="player-evolution">Evolução de rating</Subheading>
              <TotalRatingChart player={player} selectedRatingType={selectedRatingType} />
            </section>
          </div>
        </section>
      )}

      {tournaments && tournaments.length > 0 && (
        <section className="mb-0">
          <Announcement icon={Calendar01Icon} label="Histórico de Torneios" />
          <div className="py-4">
            <DataTable columns={columns} data={tournaments} />
          </div>
        </section>
      )}
    </>
  );
}

function InfoItem({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="font-medium text-base">{children ?? value}</dd>
    </div>
  );
}

function RatingBox({
  label,
  value,
  peak,
  rank,
}: {
  label: string;
  value?: number | null;
  peak?: number;
  rank: PlayerRanking["rapid"];
}) {
  const showPeak = peak !== undefined && value != null && peak > value;
  return (
    <StatTile
      label={label}
      value={value ?? "—"}
      valueClassName="text-xl sm:text-2xl"
      hint={
        rank || showPeak ? (
          <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1.5 tabular-nums">
            {rank && (
              <span className="inline-flex items-baseline gap-1">
                #{rank.position}
                <span className="sr-only"> de {rank.players} jogadores ativos</span>
                <Movement value={rank.movement} />
              </span>
            )}
            {showPeak && <span>Pico {peak}</span>}
          </span>
        ) : undefined
      }
    />
  );
}

function IdBox({ label, value, href }: { label: string; value: string; href?: string }) {
  if (!href) return <StatTile label={label} value={value} />;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group block h-full rounded-2xl outline-offset-2 focus-visible:outline-2 focus-visible:outline-ring"
    >
      <StatTile
        label={label}
        className="transition-colors duration-200 group-hover:bg-accent"
        value={
          <span className="inline-flex items-center gap-1.5 group-hover:underline">
            {value}
            <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3.5 text-muted-foreground" aria-hidden />
          </span>
        }
      />
    </a>
  );
}
