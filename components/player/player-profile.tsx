"use client"

import * as React from "react"
import { ExternalLink, ArrowUpRight, TrendingUpIcon, CalendarRangeIcon, Link2Icon, InfoIcon, TargetIcon, VerifiedIcon, BarChart3Icon } from "lucide-react"

import type { PlayerById } from "@/db/queries"
import { formatDefendingChampions } from "@/lib/defending-champions"
import { FormatPodium, FormatPodiumTitle } from "@/lib/format-podium"
import { getGradient } from "@/lib/generate-gradients"

import { columns } from "@/components/sheets/player/columns"
import { DataTable } from "@/components/sheets/player/data-table"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Announcement } from "@/components/announcement"
import { DottedSeparator } from "@/components/dotted-separator"
import { TotalRatingChart, VariationChart } from "@/components/player/player-charts"

export function PlayerProfile({ player }: { player: PlayerById }) {
  const useGradients = () => {
    const [headerGradient, avatarGradient] = React.useMemo(
      () => [getGradient(player.id), getGradient(player.id + 1)],
      [player.id]
    )
    return { headerGradient, avatarGradient }
  }
  const { headerGradient, avatarGradient } = useGradients()

  const orderPodiums = React.useMemo(() => {
    return player?.tournamentPodiums
      ? [...player.tournamentPodiums].reverse()
      : []
  }, [player?.tournamentPodiums])

  const tournaments = React.useMemo(() => {
    return player?.playersToTournaments
      ? [...player.playersToTournaments].reverse()
      : []
  }, [player?.playersToTournaments])

  const managementRole = React.useMemo(() => {
    return player?.playersToRoles?.find(
      (role) => role.role.type === "management"
    )
  }, [player?.playersToRoles])

  const refereeRole = React.useMemo(() => {
    return player?.playersToRoles?.find((role) => role.role.type === "referee")
  }, [player?.playersToRoles])

  const internalTitle = React.useMemo(() => {
    return player?.playersToTitles?.find(
      (title) => title.title.type === "internal"
    )
  }, [player?.playersToTitles])

  const externalTitle = React.useMemo(() => {
    return player?.playersToTitles?.find(
      (title) => title.title.type === "external"
    )
  }, [player?.playersToTitles])

  const [selectedRatingType, setSelectedRatingType] = React.useState("rapid")

  return (
    <>
      {/* Header Section */}
      <div className="relative">
        <div className="h-32 w-full bg-cover bg-center rounded-t-lg sm:rounded-none" style={headerGradient} />
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
                  <span className="text-highlight mr-1.5">
                    {internalTitle.title.shortTitle}
                  </span>
                )}
                {player.nickname || player.name}
              </h1>
              {player.verified && (
                <Popover>
                  <PopoverTrigger asChild className="cursor-pointer">
                    <VerifiedIcon
                      aria-label="Verificado"
                      className="!fill-sky-400 mt-1 stroke-background dark:stroke-[1.5]"
                    />
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold leading-none">Perfil verificado</h4>
                      <p className="text-sm text-muted-foreground">
                        Esse perfil teve seus dados confirmados pela federação.
                      </p>
                      <a
                        className={buttonVariants({ variant: "outline", className: "w-full" })}
                        href="https://forms.gle/Nv8nowesZ8pKxgNQ8"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Solicitar verificação
                      </a>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              {(managementRole || refereeRole) && (
                <>
                  {managementRole && (
                    <Badge variant="secondary">{managementRole.role.role}</Badge>
                  )}
                  {refereeRole && (
                    <Badge variant="default">{refereeRole.role.role}</Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      {(orderPodiums.length > 0 || (player.defendingChampions && player.defendingChampions?.length > 0)) && (
        <section className="mb-0">
          <Announcement icon={TargetIcon} label="Conquistas" className="text-sm" topSeparator />
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
                      {FormatPodium(
                        podium.place,
                        podium.tournament.championshipId ?? 0
                      )}
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
        <Announcement icon={InfoIcon} label="Informações" className="text-sm" topSeparator />

        <div className="flex flex-col">
          <InfoItem label="Nome Completo" value={player.name} isFirst />

          {internalTitle && (
            <InfoItem label="Titulação FSX" value={internalTitle.title.title} />
          )}

          {externalTitle && (
            <InfoItem label="Titulação CBX/FIDE" value={externalTitle.title.title} />
          )}

          {player.club && (
            <InfoItem label="Clube">
              <div className="flex items-center gap-2">
                <Avatar className="size-5 rounded-sm">
                  <AvatarImage
                    alt={player.club.name as string}
                    className="object-contain"
                    src={
                      (player.club.logo as string)
                        ? (player.club.logo as string)
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
                      (player.location.flag as string)
                        ? (player.location.flag as string)
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
        <Announcement icon={TrendingUpIcon} label="Ratings" className="text-sm" topSeparator />

        <div className="grid grid-cols-3 divide-x divide-border">
          <RatingBox label="Clássico" value={player.classic} />
          <RatingBox label="Rápido" value={player.rapid} />
          <RatingBox label="Blitz" value={player.blitz} />
        </div>
      </section>

      {/* IDs Section */}
      <section className="mb-0">
        <Announcement icon={Link2Icon} label="IDs" className="text-sm" topSeparator />

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

          <Announcement icon={BarChart3Icon} label="Performance" className="text-sm flex-1" topSeparator />

          <div className="p-4 space-y-6">
            <Select
              onValueChange={(value) => setSelectedRatingType(value)}
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
              <VariationChart
                player={player}
                selectedRatingType={selectedRatingType}
              />
            </div>

            <DottedSeparator className="w-full" />

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground ml-2">Evolução de Rating</h4>
              <TotalRatingChart
                player={player}
                selectedRatingType={selectedRatingType}
              />
            </div>
          </div>
        </section>
      )}

      {/* Tournaments Section */}
      {tournaments && tournaments.length > 0 && (
        <section className="mb-0">
          <Announcement icon={CalendarRangeIcon} label="Histórico de Torneios" className="text-sm" topSeparator />
          <div className="py-4">
            <DataTable columns={columns} data={tournaments} />
          </div>
        </section>
      )}
    </>
  )
}

function InfoItem({ label, value, children, isFirst }: { label: string, value?: string, children?: React.ReactNode, isFirst?: boolean }) {
  return (
    <>
      {!isFirst && <DottedSeparator className="w-full" />}
      <div className="m-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 hover:bg-muted/50 transition-colors duration-200">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <div className="mt-1 sm:mt-0 text-sm font-medium text-foreground">
            {children ? children : value}
          </div>
        </div>
      </div>
    </>
  )
}

function RatingBox({ label, value }: { label: string, value?: number | null }) {
  return (
    <div className="p-4 flex flex-col items-center justify-center hover:bg-muted/50 transition-colors duration-200">
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
      <span className="text-base font-semibold mt-1 text-primary">{value ?? "-"}</span>
    </div>
  )
}

function IdBox({ label, value, href }: { label: string, value: string, href?: string }) {
  const content = (
    <div className="p-4 flex flex-col items-center justify-center transition-colors duration-200 group h-full hover:bg-muted/50">
      <span className="text-sm font-medium transition-colors text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5 mt-1">
        <span className={`text-base font-semibold transition-colors ${href ? "group-hover:underline" : "text-foreground"}`}>{value}</span>
        {href && <ArrowUpRight className="size-3 text-muted-foreground" />}
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block h-full">
        {content}
      </a>
    )
  }

  return content
}
