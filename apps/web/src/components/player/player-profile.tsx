import type { RatingType } from "@fsx/api/rating-types";
import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@fsx/api/routers/index";
import { RECORD_HOLDER_ID, recordHolderAchievement } from "@fsx/api/gamification/badges";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
  Calendar01Icon,
  InformationCircleIcon,
  Target01Icon,
  BarChartIcon,
  ChartBarLineIcon,
  Briefcase01Icon,
  ScrollIcon,
  Medal01Icon,
} from "@hugeicons/core-free-icons";

import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { tournamentHistoryColumns } from "./tournament-history-columns";

import { Popover, PopoverContent, PopoverTrigger } from "@fsx/ui/components/popover";
import { SectionHeading } from "@/components/section-heading";
import { RankingHistoryChart, TotalRatingChart, VariationChart } from "@/components/player/player-charts";
import { cn } from "@fsx/ui/lib/utils";
import { isMedalPlace } from "@fsx/api/circuit-types";
import { podiumIcon } from "@/components/gamification/championship-icons";
import { formatIsoDate } from "@/components/gamification/tier";
import { AchievementGrid, Subheading, TrophyCabinet } from "@/components/player/player-achievements";
import { PlayerAnnouncements } from "@/components/player/player-announcements";
import { PlayerCircuits } from "@/components/player/player-circuits";
import { PlayerHero, PlayerJumpNav } from "@/components/player/player-hero";
import { RATING_FORMATS, RatingPicker } from "@/components/player/player-rating-picker";
import { PlayerStats } from "@/components/player/player-stats";
import { PlayerTitlePath } from "@/components/player/player-title-path";
import { byTitleTier } from "@/components/player/title-emblems";
import type { ClubStanding, PlayerAnnouncement, PlayerCircuitSeason, PlayerRanking, PlayerStatsResult } from "@/components/player/types";
import { useTRPC } from "@/lib/trpc";

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

export type PlayerById = NonNullable<inferRouterOutputs<AppRouter>["players"]["byId"]>;

const SECTION = "scroll-mt-16";
const MIN_CHART_TOURNAMENTS = 3;

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
      if (!isMedalPlace(podium.place)) continue;
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

  // Site-wide emblem data (rarity, record holders). Loaded after the page renders:
  // it can trigger the all-careers recompute, which must never delay the profile.
  const trpc = useTRPC();
  const { data: badges } = useQuery(trpc.records.badges.queryOptions());
  const { data: rankingHistory } = useQuery(trpc.players.rankingHistory.queryOptions({ id: player.id }));
  const heldRecords = badges?.recordHolders[player.id];
  const achievements = React.useMemo(
    () => (heldRecords ? [...stats.achievements, recordHolderAchievement(heldRecords)] : stats.achievements),
    [stats.achievements, heldRecords],
  );
  const rarity = React.useCallback(
    (id: string) => {
      if (!badges || badges.players === 0) return undefined;
      const holders = id === RECORD_HOLDER_ID ? Object.keys(badges.recordHolders).length : badges.holders[id];
      return holders === undefined ? undefined : holders / badges.players;
    },
    [badges],
  );

  const medalCount = Object.values(stats.stats.medals).reduce((sum, m) => sum + m.gold + m.silver + m.bronze, 0);

  const tournaments = React.useMemo(() => {
    const categories = new Map<number, string>();
    for (const result of player?.circuitResults ?? []) {
      if (result.category && result.circuitPhases) categories.set(result.circuitPhases.tournamentId, result.category);
    }
    return [...(player?.playersToTournaments ?? [])]
      .reverse()
      .map((entry) => ({ ...entry, category: categories.get(entry.tournament.id) ?? null }));
  }, [player?.playersToTournaments, player?.circuitResults]);

  const internalTitle = player?.playersToTitles?.find((title) => title.title.type === "internal");

  // Opens on the format the player actually plays most.
  const [selectedRatingType, setSelectedRatingType] = React.useState<RatingType>(() => {
    const played = { classic: 0, rapid: 0, blitz: 0 };
    for (const entry of player.playersToTournaments ?? []) {
      const type = entry.tournament.ratingType as RatingType;
      if (type in played) played[type] += 1;
    }
    return RATING_FORMATS.reduce((best, { key }) => (played[key] > played[best] ? key : best), "rapid" as RatingType);
  });
  const selectedLabel = RATING_FORMATS.find(({ key }) => key === selectedRatingType)?.label;
  const selectedRankingHistory = player.active && rankingHistory ? rankingHistory[selectedRatingType] : undefined;
  const showRankingChart = (selectedRankingHistory?.length ?? 0) >= 2;
  const playedInFormat = tournaments.filter((entry) => entry.tournament.ratingType === selectedRatingType).length;
  const enoughForCharts = playedInFormat >= MIN_CHART_TOURNAMENTS;

  const hasAchievements = podiumGroups.length > 0 || medalCount > 0 || stats.achievements.length > 0 || stats.upcoming.length > 0;
  const hasCareer = stats.stats.tournamentsPlayed > 0 || circuitSeasons.length > 0;
  const showFullName = Boolean(player.nickname) && player.nickname !== player.name;

  const sections = [
    { id: "ratings", label: "Ratings", show: true },
    { id: "conquistas", label: "Conquistas", show: hasAchievements },
    { id: "carreira", label: "Carreira", show: hasCareer },
    { id: "titulos", label: "Títulos", show: stats.titlePath.length > 0 },
    { id: "comunicados", label: "Comunicados", show: announcements.length > 0 },
    { id: "historico", label: "Histórico", show: tournaments.length > 0 },
    { id: "dados", label: "Dados", show: true },
  ].filter((section) => section.show);

  return (
    <>
      <PlayerHero
        player={player}
        level={stats.level}
        titleEmblems={titleEmblems}
        internalTitleShortName={internalTitle?.title.shortName}
        clubStanding={clubStanding}
      />
      <PlayerJumpNav sections={sections} />

      <section id="ratings" className={SECTION}>
        <SectionHeading icon={ChartBarLineIcon} label="Ratings" />
        <RatingPicker
          ratings={{ classic: player.classic, rapid: player.rapid, blitz: player.blitz }}
          peaks={{
            classic: stats.stats.formats.classic?.peak.rating,
            rapid: stats.stats.formats.rapid?.peak.rating,
            blitz: stats.stats.formats.blitz?.peak.rating,
          }}
          ranking={player.active ? ranking : null}
          showFemale={player.sex === "female"}
          selected={selectedRatingType}
          onSelect={setSelectedRatingType}
        />
        {tournaments.length > 0 && (
          <p className="px-3 pt-2 text-center text-muted-foreground text-sm">Selecione um formato para ver a evolução abaixo.</p>
        )}
      </section>

      {tournaments.length > 0 && (
        <section aria-label={`Evolução · ${selectedLabel}`} className="mt-6">
          <SectionHeading icon={BarChartIcon} label={`Evolução · ${selectedLabel}`} />
          <div className="grid gap-4 px-2 pb-4 sm:px-4">
            {enoughForCharts ? (
              <>
                <TotalRatingChart player={player} selectedRatingType={selectedRatingType} />
                <div className={cn("grid gap-4", showRankingChart && "sm:grid-cols-2")}>
                  <VariationChart player={player} selectedRatingType={selectedRatingType} />
                  {showRankingChart && <RankingHistoryChart points={selectedRankingHistory!} />}
                </div>
              </>
            ) : (
              <>
                <p className="rounded-2xl bg-muted p-4 text-center text-muted-foreground text-sm">
                  {playedInFormat === 0
                    ? `Nenhum torneio de ${selectedLabel?.toLowerCase()} registrado.`
                    : `Só ${playedInFormat} torneio${playedInFormat === 1 ? "" : "s"} de ${selectedLabel?.toLowerCase()}: o gráfico aparece a partir de ${MIN_CHART_TOURNAMENTS}.`}
                </p>
                {showRankingChart && <RankingHistoryChart points={selectedRankingHistory!} />}
              </>
            )}
          </div>
        </section>
      )}

      {hasAchievements && (
        <section id="conquistas" className={cn(SECTION, "mt-6")}>
          <SectionHeading icon={Target01Icon} label="Conquistas" />
          <div className="grid gap-6 px-3 pt-1 pb-4">
            <TrophyCabinet medals={stats.stats.medals} />

            {podiumGroups.length > 0 && (
              <section aria-labelledby="player-podiums">
                <Subheading id="player-podiums" aside="Toque num ícone para ver o torneio">
                  Pódios por campeonato
                </Subheading>
                <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
                  {podiumGroups.map((group) => (
                    <section
                      key={group.name}
                      aria-label={`Pódios · ${group.name}`}
                      className={cn(group.podiums.length > 4 && "col-span-full")}
                    >
                      <p className="mb-2 flex items-baseline justify-between gap-2 font-medium text-sm">
                        <span>{group.name}</span>
                        {group.titles > 0 && (
                          <span className="text-muted-foreground tabular-nums">
                            {group.titles} título{group.titles === 1 ? "" : "s"}
                          </span>
                        )}
                      </p>
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
                                <Link to="/torneios/$id" params={{ id: podium.tournament.id }} className="link-inline mt-1">
                                  Ver torneio
                                </Link>
                              </PopoverContent>
                            </Popover>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </section>
            )}

            <AchievementGrid achievements={achievements} upcoming={stats.upcoming} rarity={rarity} />
          </div>
        </section>
      )}

      {hasCareer && (
        <section id="carreira" className={cn(SECTION, "mt-6")}>
          <SectionHeading icon={Briefcase01Icon} label="Carreira" />
          <PlayerStats playerId={player.id} stats={stats.stats} tournaments={stats.tournaments} />
          {circuitSeasons.length > 0 && (
            <div className="px-2 pb-2 sm:px-4">
              <Subheading>Circuitos</Subheading>
              <PlayerCircuits seasons={circuitSeasons} />
            </div>
          )}
        </section>
      )}

      {stats.titlePath.length > 0 && (
        <section id="titulos" aria-label="Caminho para títulos" className={cn(SECTION, "mt-6")}>
          <SectionHeading icon={Medal01Icon} label="Caminho para títulos" />
          <PlayerTitlePath goals={stats.titlePath} />
        </section>
      )}

      {announcements.length > 0 && (
        <section id="comunicados" aria-label="Comunicados" className={cn(SECTION, "mt-6")}>
          <SectionHeading icon={ScrollIcon} label="Comunicados" />
          <PlayerAnnouncements announcements={announcements} />
        </section>
      )}

      {tournaments.length > 0 && (
        <section id="historico" className={cn(SECTION, "mt-6")}>
          <SectionHeading icon={Calendar01Icon} label="Histórico de Torneios" />
          <div className="py-4">
            <DataTable
              columns={tournamentHistoryColumns}
              data={tournaments}
              pagination={(table) => <DataTablePagination table={table} />}
              pageSize={10}
            />
          </div>
        </section>
      )}

      <section id="dados" className={cn(SECTION, "mt-6")}>
        <SectionHeading icon={InformationCircleIcon} label="Dados" />
        <dl className="flex flex-col divide-y px-3">
          {showFullName && <InfoItem label="Nome completo" value={player.name} />}
          <InfoItem label="ID FSX" value={String(player.id)} />
          <InfoItem label="ID CBX">
            <ExternalId id={player.cbxId} href={player.cbxId ? `https://www.cbx.org.br/jogador/${player.cbxId}` : undefined} />
          </InfoItem>
          <InfoItem label="ID FIDE">
            <ExternalId id={player.fideId} href={player.fideId ? `https://ratings.fide.com/profile/${player.fideId}` : undefined} />
          </InfoItem>
        </dl>
      </section>
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
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-right font-medium text-base tabular-nums">{children ?? value}</dd>
    </div>
  );
}

function ExternalId({ id, href }: { id: number | string | null | undefined; href: string | undefined }) {
  if (!id || !href) return <span className="text-muted-foreground">—</span>;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="link-inline inline-flex items-center gap-1.5">
      {id}
      <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-3.5" aria-hidden />
    </a>
  );
}
