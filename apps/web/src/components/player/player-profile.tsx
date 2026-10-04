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
  ZapIcon,
  CrownIcon,
  Medal01Icon,
  MedalFirstPlaceIcon,
  MedalThirdPlaceIcon,
  RabbitIcon,
  Loading01Icon,
  TrainIcon,
  SwordsIcon,
  Analytics01Icon,
  Route01Icon,
  ScrollIcon,
} from "@hugeicons/core-free-icons";

import { columns } from "@/components/sheets/player/columns";
import { DataTable } from "@/components/sheets/player/data-table";

import { Avatar, AvatarFallback, AvatarImage } from "@fsx/ui/components/avatar";
import { Badge } from "@fsx/ui/components/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@fsx/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fsx/ui/components/select";
import { VerifiedBadge } from "@/components/player/verified-badge";
import { Announcement } from "@/components/announcement";
import { TotalRatingChart, VariationChart } from "@/components/player/player-charts";
import { cn } from "@fsx/ui/lib/utils";
import { avatarGradient, avatarGradientFor } from "@/components/avatar-gradient";
import { PlayerLevel } from "@/components/gamification/player-level";
import { TIER_CLASSES, formatIsoDate } from "@/components/gamification/tier";
import { AchievementGrid, Subheading, TrophyCabinet } from "@/components/player/player-achievements";
import { PlayerAnnouncements } from "@/components/player/player-announcements";
import { PlayerCircuits } from "@/components/player/player-circuits";
import { PlayerStats } from "@/components/player/player-stats";
import { byTitleTier } from "@/components/player/title-emblems";
import type { ClubStanding, PlayerAnnouncement, PlayerCircuitSeason, PlayerRanking, PlayerStatsResult } from "@/components/player/types";
import { Movement } from "@/components/gamification/movement";

function FormatPodium(place: number | null | undefined, championship_id: number) {
  if (place === 1 && championship_id === 1) {
    return <HugeiconsIcon icon={Loading01Icon} className="size-5" strokeWidth={1.75} aria-hidden />;
  }

  if (place === 1 && championship_id === 2) {
    return <HugeiconsIcon icon={RabbitIcon} className="size-5" strokeWidth={1.75} aria-hidden />;
  }

  if (place === 1 && championship_id === 3) {
    return <HugeiconsIcon icon={ZapIcon} className="size-5" strokeWidth={1.75} aria-hidden />;
  }

  if (place === 1 && championship_id === 4) {
    return <HugeiconsIcon icon={CrownIcon} className="size-5" strokeWidth={1.75} aria-hidden />;
  }

  if (place === 1 && championship_id === 5) {
    return <HugeiconsIcon icon={SwordsIcon} className="size-5" strokeWidth={1.75} aria-hidden />;
  }

  if (place === 1 && championship_id === 6) {
    return <HugeiconsIcon icon={TrainIcon} className="size-5" strokeWidth={1.75} aria-hidden />;
  }

  if (place === 1) {
    return <HugeiconsIcon icon={MedalFirstPlaceIcon} className="size-5" strokeWidth={1.75} aria-hidden />;
  }

  if (place === 2) {
    return <HugeiconsIcon icon={Medal01Icon} className="size-5" strokeWidth={1.75} aria-hidden />;
  }

  if (place === 3) {
    return <HugeiconsIcon icon={MedalThirdPlaceIcon} className="size-5" strokeWidth={1.75} aria-hidden />;
  }
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

const DEFENDING_CHAMPIONS: Record<string, { icon: typeof CrownIcon; label: string }> = {
  Absoluto: { icon: Loading01Icon, label: "Atual campeão Sergipano Absoluto" },
  Rápido: { icon: RabbitIcon, label: "Atual campeão Sergipano Rápido" },
  Blitz: { icon: ZapIcon, label: "Atual campeão Sergipano Blitz" },
  Feminino: { icon: CrownIcon, label: "Atual campeã Sergipana Feminino" },
  Equipes: { icon: SwordsIcon, label: "Atual campeão Sergipano Equipes" },
};

const PLACE_TIERS = { 1: "gold", 2: "silver", 3: "bronze" } as const;

const medalButton =
  "inline-flex size-11 items-center justify-center rounded-xl outline-offset-2 transition-[scale,box-shadow] duration-150 ease-out hover:shadow-[inset_0_0_0_1px_currentColor] focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.96]";

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

  const ratingTypeLabels: Record<string, string> = {
    classic: "Clássico",
    rapid: "Rápido",
    blitz: "Blitz",
  };

  return (
    <>
      {/* Header Section */}
      <div className="relative">
        <div className="px-4 pb-4">
          <div className="mb-4 flex justify-center pt-12">
            <Avatar className="h-24 w-24 after:border-0 after:mix-blend-normal">
              <AvatarImage
                alt={player.name}
                src={player.imageUrl ?? ""}
                className="h-full w-full object-cover rounded-2xl"
              />
              <AvatarFallback className={cn("rounded-2xl", avatarGradient(player.id))} />
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

      {/* Achievements Section */}
      {(podiumGroups.length > 0 ||
        medalCount > 0 ||
        stats.achievements.length > 0 ||
        stats.upcoming.length > 0 ||
        (player.defendingChampions && player.defendingChampions?.length > 0)) && (
          <section className="mb-0">
            <Announcement icon={Target01Icon} label="Conquistas" className="text-sm" />
            <div className="grid gap-6 px-3 pt-1 pb-4">
              <TrophyCabinet medals={stats.stats.medals} />
              <AchievementGrid achievements={stats.achievements} upcoming={stats.upcoming} />
              {player.defendingChampions && player.defendingChampions.length > 0 && (
                <section aria-labelledby="player-defending">
                  <Subheading id="player-defending">Atual campeão</Subheading>
                  <ul className="flex flex-wrap gap-2">
                    {player.defendingChampions.map(({ championship }) => {
                      const defending = DEFENDING_CHAMPIONS[championship.name];
                      if (!defending) return null;
                      return (
                        <li key={championship.name}>
                          <Popover>
                            <PopoverTrigger aria-label={defending.label} className={cn(medalButton, TIER_CLASSES.gold)}>
                              <HugeiconsIcon icon={defending.icon} className="size-5" strokeWidth={1.75} aria-hidden />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2 text-xs font-medium">{defending.label}</PopoverContent>
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
                                className={cn(
                                  medalButton,
                                  podium.place && podium.place <= 3
                                    ? TIER_CLASSES[PLACE_TIERS[podium.place as 1 | 2 | 3]]
                                    : "bg-muted text-muted-foreground",
                                )}
                              >
                                {FormatPodium(podium.place, podium.category ? 0 : (podium.tournament.championshipId ?? 0))}
                              </PopoverTrigger>
                              <PopoverContent className="w-auto max-w-64 gap-0.5 p-2 text-xs">
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

      {/* Info Section */}
      <section className="mb-0">
        <Announcement icon={InformationCircleIcon} label="Informações" className="text-sm" />

        <div className="flex flex-col">
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
                  <span className="text-muted-foreground text-xs">#{clubStanding.rank.rapid} entre os clubes</span>
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

          {player.active ? (
            <InfoItem label="Status">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
                </span>
                <p>Ativo</p>
              </div>
            </InfoItem>
          ) : (
            <InfoItem label="Status">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500/75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-600" />
                </span>
                <p>Inativo</p>
              </div>
            </InfoItem>
          )}
        </div>
      </section>

      {/* Ratings Section */}
      <section className="mb-0">
        <Announcement icon={ChartBarLineIcon} label="Ratings" className="text-sm" />

        <div className="grid grid-cols-3 gap-2 px-2 sm:gap-4 sm:px-4">
          <RatingBox label="Clássico" value={player.classic} peak={stats.stats.formats.classic?.peak.rating} rank={ranking.classic} />
          <RatingBox label="Rápido" value={player.rapid} peak={stats.stats.formats.rapid?.peak.rating} rank={ranking.rapid} />
          <RatingBox label="Blitz" value={player.blitz} peak={stats.stats.formats.blitz?.peak.rating} rank={ranking.blitz} />
        </div>
      </section>

      {stats.stats.tournamentsPlayed > 0 && (
        <section className="mb-0">
          <Announcement icon={Analytics01Icon} label="Estatísticas" className="text-sm" />
          <PlayerStats playerId={player.id} stats={stats.stats} tournaments={stats.tournaments} />
        </section>
      )}

      {circuitSeasons.length > 0 && (
        <section className="mb-0">
          <Announcement icon={Route01Icon} label="Circuitos" className="text-sm" />
          <PlayerCircuits seasons={circuitSeasons} />
        </section>
      )}

      {announcements.length > 0 && (
        <section className="mb-0">
          <Announcement icon={ScrollIcon} label="Comunicados" className="text-sm" />
          <PlayerAnnouncements announcements={announcements} />
        </section>
      )}

      {/* IDs Section */}
      <section className="mb-0">
        <Announcement icon={Link02Icon} label="IDs" className="text-sm" />

        <div className="grid grid-cols-3 gap-2 px-2 sm:gap-4 sm:px-4">
          <IdBox label="ID FSX" value={String(player.id)} />
          <IdBox
            label="ID CBX"
            value={player.cbxId ? String(player.cbxId) : "-"}
            href={player.cbxId ? `https://www.cbx.org.br/jogador/${player.cbxId}` : undefined}
          />
          <IdBox
            label="ID FIDE"
            value={player.fideId ? String(player.fideId) : "-"}
            href={player.fideId ? `https://ratings.fide.com/profile/${player.fideId}` : undefined}
          />
        </div>
      </section>

      {/* Performance Section */}
      {tournaments.length > 0 && (
        <section className="mb-0">
          <Announcement icon={BarChartIcon} label="Performance" className="text-sm flex-1" />

          <div className="p-4 space-y-6">
            <Select
              onValueChange={(value) => value && setSelectedRatingType(value)}
              value={selectedRatingType}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs" aria-label="Tipo de rating">
                <SelectValue placeholder="Rating">
                  {(value) => ratingTypeLabels[value as string] ?? value}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="classic">Clássico</SelectItem>
                <SelectItem value="rapid">Rápido</SelectItem>
                <SelectItem value="blitz">Blitz</SelectItem>
              </SelectContent>
            </Select>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground ml-2">Variação de Rating</h4>
              <VariationChart player={player} selectedRatingType={selectedRatingType} />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground ml-2">Evolução de Rating</h4>
              <TotalRatingChart player={player} selectedRatingType={selectedRatingType} />
            </div>
          </div>
        </section>
      )}

      {/* Tournaments Section */}
      {tournaments && tournaments.length > 0 && (
        <section className="mb-0">
          <Announcement icon={Calendar01Icon} label="Histórico de Torneios" className="text-sm" />
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
    <>
      <div className="m-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-muted/50 transition-colors duration-200">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <div className="mt-1 sm:mt-0 text-sm font-medium text-foreground">
            {children ? children : value}
          </div>
        </div>
      </div>
    </>
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
  return (
    <div className="bg-muted rounded-2xl flex h-full flex-col items-center justify-center gap-1 p-3 sm:p-4">
      <span className="text-xs sm:text-sm text-foreground/70 font-medium text-center">{label}</span>
      <span className="text-sm sm:text-base font-semibold text-foreground font-mono tabular-nums">
        {value ?? "-"}
      </span>
      {rank && (
        <span className="inline-flex items-baseline gap-1 text-[11px] text-foreground/70 tabular-nums">
          <span>
            #{rank.position}
            <span className="sr-only"> de {rank.players} jogadores ativos</span>
          </span>
          <Movement value={rank.movement} />
        </span>
      )}
      {peak !== undefined && value != null && peak > value && (
        <span className="text-[11px] text-foreground/70 tabular-nums">Pico {peak}</span>
      )}
    </div>
  );
}

function IdBox({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <div className="bg-muted rounded-2xl flex h-full flex-col items-center justify-center gap-1 p-3 sm:p-4">
      <span className="text-xs sm:text-sm text-foreground/70 font-medium text-center">{label}</span>
      <div className="flex items-center gap-1.5">
        <span
          className={`text-sm sm:text-base font-semibold font-mono tabular-nums ${href ? "group-hover:underline" : "text-foreground"}`}
        >
          {value}
        </span>
        {href && (
          <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3 text-muted-foreground" />
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block h-full">
        {content}
      </a>
    );
  }

  return content;
}
