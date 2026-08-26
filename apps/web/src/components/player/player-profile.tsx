import * as React from "react";
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
  TrainIcon,
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
import { getGradient } from "@/lib/gradients";

function FormatPodium(place: number | null | undefined, championship_id: number) {
  if (place === 1 && championship_id === 1) {
    return <HugeiconsIcon icon={TrainIcon} className="size-4" />;
  }

  if (place === 1 && championship_id === 2) {
    return <HugeiconsIcon icon={TrainIcon} className="size-4" />;
  }

  if (place === 1 && championship_id === 3) {
    return <HugeiconsIcon icon={ZapIcon} className="size-4" />;
  }

  if (place === 1 && championship_id === 4) {
    return <HugeiconsIcon icon={CrownIcon} className="size-4" />;
  }

  if (place === 1 && championship_id === 5) {
    return <HugeiconsIcon icon={ZapIcon} className="size-4" />;
  }

  if (place === 1 && championship_id === 6) {
    return <HugeiconsIcon icon={TrainIcon} className="size-4" />;
  }

  if (place === 2) {
    return <HugeiconsIcon icon={Medal01Icon} className="size-4" />;
  }
}

function FormatPodiumTitle(place: number | null | undefined) {
  if (place === 1) {
    return "Campeão(ã)";
  }
  if (place === 2) {
    return "Vice-Campeão(ã)";
  }
}

function formatDefendingChampions(championship: string) {
  if (championship === "Absoluto") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={TrainIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Absoluto</PopoverContent>
      </Popover>
    );
  }

  if (championship === "Rápido") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={TrainIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Rápido</PopoverContent>
      </Popover>
    );
  }

  if (championship === "Blitz") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={ZapIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Blitz</PopoverContent>
      </Popover>
    );
  }

  if (championship === "Feminino") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={CrownIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeã Sergipana Feminino</PopoverContent>
      </Popover>
    );
  }

  if (championship === "Equipes") {
    return (
      <Popover>
        <PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
          <HugeiconsIcon icon={ZapIcon} className="size-4" />
        </PopoverTrigger>
        <PopoverContent>Atual campeão Sergipano Equipes</PopoverContent>
      </Popover>
    );
  }
}

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
    };
  }>;
  tournamentPodiums?: Array<{
    place: number | null;
    tournament: {
      name: string;
      championshipId?: number | null;
    };
  }>;
  defendingChampions?: Array<{
    championship: {
      name: string;
    };
  }>;
  club?: {
    name: string;
    logoUrl?: string | null;
  } | null;
  location?: {
    name: string;
    flagUrl?: string | null;
  } | null;
}

export function PlayerProfile({ player }: { player: PlayerById }) {
  const useGradients = () => {
    const [headerGradient, avatarGradient] = React.useMemo(
      () => [getGradient(player.id), getGradient(player.id + 1)],
      [player.id],
    );
    return { headerGradient, avatarGradient };
  };
  const { headerGradient, avatarGradient } = useGradients();

  const orderPodiums = React.useMemo(() => {
    return player?.tournamentPodiums ? [...player.tournamentPodiums].reverse() : [];
  }, [player?.tournamentPodiums]);

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
      {/* Header Section */}
      <div className="relative">
        <div
          className="h-32 w-full bg-cover bg-center rounded-t-lg sm:rounded-none"
          style={headerGradient}
        />
        <div className="px-4 pb-4">
          <div className="-mt-12 mb-4 flex justify-center">
            <Avatar className="h-24 w-24 rounded-[20px] border-4 border-background shadow-sm">
              <AvatarImage
                alt={player.name}
                src={player.imageUrl ?? ""}
                className="h-full w-full object-cover"
              />
              <AvatarFallback style={avatarGradient} className="rounded-[16px]" />
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

            <div className="flex flex-wrap items-center justify-center gap-2">
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
      {(orderPodiums.length > 0 ||
        (player.defendingChampions && player.defendingChampions?.length > 0)) && (
        <section className="mb-0">
          <Announcement icon={Target01Icon} label="Conquistas" className="text-sm" />
          <div className="p-3 grid gap-4">
            {player.defendingChampions && player.defendingChampions?.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {player.defendingChampions?.map((championship) => (
                  <div key={championship.championship.name}>
                    {formatDefendingChampions(championship.championship.name)}
                  </div>
                ))}
              </div>
            )}

            {orderPodiums.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {orderPodiums.map((podium) => (
                  <Popover key={podium.place + podium.tournament.name}>
                    <PopoverTrigger className="rounded-md bg-muted p-2 text-xs font-medium transition-colors">
                      {FormatPodium(podium.place, podium.tournament.championshipId ?? 0)}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2 text-xs font-medium">
                      {FormatPodiumTitle(podium.place)} {podium.tournament.name}
                    </PopoverContent>
                  </Popover>
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
                <Avatar className="size-5 rounded-sm">
                  <AvatarImage
                    alt={player.club.name as string}
                    className="object-contain"
                    src={
                      (player.club.logoUrl as string)
                        ? (player.club.logoUrl as string)
                        : "https://9nkvm1j67x.ufs.sh/f/sYfAN6LQ1AETco3Au5eYS2IjeoXsEn9KCrbdDHA1QgFqau4T"
                    }
                  />
                  <AvatarFallback className="rounded-none bg-transparent" />
                </Avatar>
                <span>{player.club.name}</span>
              </div>
            </InfoItem>
          )}

          {player.location && (
            <InfoItem label="Localização">
              <div className="flex items-center gap-2">
                <Avatar className="size-5 rounded-sm">
                  <AvatarImage
                    alt={player.location.name as string}
                    className="object-contain"
                    src={
                      (player.location.flagUrl as string)
                        ? (player.location.flagUrl as string)
                        : "https://9nkvm1j67x.ufs.sh/f/sYfAN6LQ1AETco3Au5eYS2IjeoXsEn9KCrbdDHA1QgFqau4T"
                    }
                  />
                  <AvatarFallback className="rounded-none bg-transparent" />
                </Avatar>
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

        <div className="grid grid-cols-3 divide-x divide-border">
          <RatingBox label="Clássico" value={player.classic} />
          <RatingBox label="Rápido" value={player.rapid} />
          <RatingBox label="Blitz" value={player.blitz} />
        </div>
      </section>

      {/* IDs Section */}
      <section className="mb-0">
        <Announcement icon={Link02Icon} label="IDs" className="text-sm" />

        <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-y sm:divide-y-0 divide-border">
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
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Rating" />
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

function RatingBox({ label, value }: { label: string; value?: number | null }) {
  return (
    <div className="p-4 flex flex-col items-center justify-center hover:bg-muted/50 transition-colors duration-200">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span className="text-base font-semibold mt-1 text-primary font-mono tabular-nums">
        {value ?? "-"}
      </span>
    </div>
  );
}

function IdBox({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <div className="p-4 flex flex-col items-center justify-center transition-colors duration-200 group h-full hover:bg-muted/50">
      <span className="text-sm font-medium transition-colors text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5 mt-1">
        <span
          className={`text-base font-semibold transition-colors font-mono tabular-nums ${href ? "group-hover:underline" : "text-foreground"}`}
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
