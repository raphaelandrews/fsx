import { type ReactNode, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ExternalLink, VerifiedIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  Cell,
  LabelList,
  YAxis,
  LineChart,
  Line,
} from "recharts";

import { FormatPodium, FormatPodiumTitle } from "~/lib/format-podium";
import { getGradient } from "~/lib/generate-gradients";

import { playerByIdQueryOptions, type PlayerById } from "~/db/queries";

import { columns } from "./columns";
import { DataTable } from "./data-table";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { buttonVariants } from "~/components/ui/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";

interface Props {
  id: number;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PlayerModal = ({ id, open, setOpen }: Props) => {
  const playerQuery = useQuery(playerByIdQueryOptions(id));
  const player = playerQuery.data;
  const [selectedRatingType, setSelectedRatingType] = useState("rapid");

  const useGradients = () => {
    const [headerGradient, avatarGradient] = useMemo(
      () => [getGradient(), getGradient()],
      []
    );

    return { headerGradient, avatarGradient };
  };
  const { headerGradient, avatarGradient } = useGradients();

  const orderPodiums = useMemo(() => {
    return player?.tournamentPodiums
      ? [...player.tournamentPodiums].reverse()
      : [];
  }, [player?.tournamentPodiums]);

  const tournaments = useMemo(() => {
    return player?.playersToTournaments
      ? [...player.playersToTournaments].reverse()
      : [];
  }, [player?.playersToTournaments]);

  const managementRole = useMemo(() => {
    return player?.playersToRoles?.find(
      (role: { role: { type: string } }) => role.role.type === "management"
    );
  }, [player?.playersToRoles]);

  const refereeRole = useMemo(() => {
    return player?.playersToRoles?.find(
      (role: { role: { type: string } }) => role.role.type === "referee"
    );
  }, [player?.playersToRoles]);

  const internalTitle = useMemo(() => {
    return player?.playersToTitles?.find(
      (title: { title: { type: string } }) => title.title.type === "internal"
    );
  }, [player?.playersToTitles]);

  const externalTitle = useMemo(() => {
    return player?.playersToTitles?.find(
      (title: { title: { type: string } }) => title.title.type === "external"
    );
  }, [player?.playersToTitles]);

  if (playerQuery.isLoading) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="[&>button#close-dialog]:top-1 [&>button#close-dialog]:right-1 gap-0 w-[90%] max-w-[500px] h-[80dvh] overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col items-center justify-center h-full">
            <Skeleton className="w-20 h-20 rounded-full mb-4" />
            <Skeleton className="w-48 h-6 mb-2" />
            <Skeleton className="w-32 h-4" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (playerQuery.isError || !player) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="[&>button#close-dialog]:top-1 [&>button#close-dialog]:right-1 gap-0 w-[90%] max-w-[500px] h-[80dvh] overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col items-center justify-center h-full">
            <p>Error loading player data. Please try again.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="[&>button#close-dialog]:top-1 [&>button#close-dialog]:right-1 gap-0 w-[90%] max-w-[500px] h-[80dvh] overflow-y-auto overflow-x-hidden">
        <div className="max-w-[calc(100vw-10%-3rem+2px)]">
          <DialogHeader>
            <div className="relative mb-12">
              <div className="w-full h-32 rounded-md" style={headerGradient} />
              <Avatar className="absolute w-20 h-20 rounded-[10px] border-4 border-background left-1/2 -translate-y-1/2 -translate-x-1/2">
                <AvatarImage
                  src={player.imageUrl ?? undefined}
                  alt={player.name}
                />
                <AvatarFallback style={avatarGradient} />
              </Avatar>
            </div>
            <div className="flex justify-center items-center gap-1">
              <DialogTitle className="text-center mt-1">
                {internalTitle && (
                  <span className="text-gold">
                    {internalTitle.title.shortTitle}{" "}
                  </span>
                )}
                {player.nickname ? player.nickname : player.name}
              </DialogTitle>
              {player.verified && (
                <Popover>
                  <PopoverTrigger asChild className="hover:cursor-pointer">
                    <VerifiedIcon
                      className="!fill-[#1CA0F2] dark:stroke-[1.5] stroke-background mt-1"
                      aria-label="Verificado"
                    />
                  </PopoverTrigger>
                  <PopoverContent>
                    <p className="text-primary font-semibold">
                      Perfil verificado
                    </p>
                    <p className="text-alternative font-medium text-sm mt-2">
                      Esse perfil atualizou os dados e foi verificado.
                    </p>
                    <a
                      href="https://forms.gle/Nv8nowesZ8pKxgNQ8"
                      target="_blank"
                      rel="noreferrer"
                      className={`${buttonVariants({ variant: "default" })} w-full mt-3`}
                    >
                      Obter verificação
                    </a>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </DialogHeader>

          {(managementRole || refereeRole) && (
            <div className="flex flex-col justify-center items-center gap-1.5 mt-8">
              {managementRole && (
                <Badge variant="default">{managementRole.role.role}</Badge>
              )}
              {refereeRole && (
                <Badge variant="default">{refereeRole.role.role}</Badge>
              )}
            </div>
          )}

          {orderPodiums.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mt-8">
              {orderPodiums.map((podium) => (
                <Popover key={podium.place + podium.tournament.name}>
                  <PopoverTrigger className="text-primary p-2 rounded-md bg-primary-foreground/60">
                    {FormatPodium(
                      podium.place,
                      (podium.tournament.championshipId as number) || 0
                    )}
                  </PopoverTrigger>
                  <PopoverContent className="text-center max-w-72">
                    {FormatPodiumTitle(podium.place)}{" "}
                    {podium.tournament.name as string}
                  </PopoverContent>
                </Popover>
              ))}
            </div>
          )}

          {!managementRole && !refereeRole && orderPodiums.length <= 0 && (
            <div className="pt-3" />
          )}

          <div className="mt-5">
            <Info label="Nome" content={player.name} />

            {internalTitle && (
              <Info label="Titulação">
                {internalTitle && <p>{internalTitle.title.title}</p>}
              </Info>
            )}

            {externalTitle && (
              <Info label="Titulação CBX/FIDE">
                {externalTitle && <p>{externalTitle.title.title}</p>}
              </Info>
            )}

            {player.club && player.club.name !== null && (
              <Info label="Clube">
                <div className="flex items-center gap-2">
                  <Avatar className="size-4 rounded object-contain">
                    <AvatarImage
                      src={
                        (player.club.logo as string)
                          ? (player.club.logo as string)
                          : "https://9nkvm1j67x.ufs.sh/f/sYfAN6LQ1AETco3Au5eYS2IjeoXsEn9KCrbdDHA1QgFqau4T"
                      }
                      alt={player.club.name as string}
                      title={player.club.name as string}
                      className="size-4 rounded object-contain"
                    />
                    <AvatarFallback className="size-4 rounded-none object-contain" />
                  </Avatar>
                  <p>{player.club.name as string}</p>
                </div>
              </Info>
            )}

            {player.location && player.location.name !== null && (
              <Info label="Local">
                <div className="flex items-center gap-2">
                  <Avatar className="size-4 rounded object-contain">
                    <AvatarImage
                      src={
                        (player.location.flag as string)
                          ? (player.location.flag as string)
                          : "https://9nkvm1j67x.ufs.sh/f/sYfAN6LQ1AETco3Au5eYS2IjeoXsEn9KCrbdDHA1QgFqau4T"
                      }
                      alt={player.location.name as string}
                      title={player.location.name as string}
                      className="size-4 rounded object-contain"
                    />
                    <AvatarFallback className="size-4 rounded-none object-contain" />
                  </Avatar>
                  <p>{player.location?.name as string}</p>
                </div>
              </Info>
            )}

            <Info label="Status">
              {player.active ? (
                <div className="flex items-center gap-2">
                  <span className="relative flex w-2 h-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600" />
                  </span>
                  <p>Ativo</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="relative flex w-2 h-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
                  </span>
                  <p>Inativo</p>
                </div>
              )}
            </Info>
          </div>

          <div className="mt-3">
            <Info label="Ratings" />
            <div className="grid grid-cols-3 gap-2">
              <RatingCard label="Clássico" rating={player.classic} />
              <RatingCard label="Rápido" rating={player.rapid} />
              <RatingCard label="Blitz" rating={player.blitz} />
            </div>

            <Info label="IDs" />
            <div className="grid grid-cols-3 gap-2">
              <RatingCard label="FSX" rating={player.id} />
              <RatingCard
                label="CBX"
                link={
                  player.cbxId ? (
                    <a
                      href={`https://www.cbx.org.br/jogador/${player.cbxId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex justify-center text-primary hover:underline transition"
                    >
                      {player.cbxId} <ExternalLink className="w-4 ml-2" />
                    </a>
                  ) : (
                    <span>-</span>
                  )
                }
              />
              <RatingCard
                label="FIDE"
                link={
                  player.fideId ? (
                    <a
                      href={`https://ratings.fide.com/profile/${player.fideId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex justify-center text-primary hover:underline transition"
                    >
                      {player.fideId} <ExternalLink className="w-4 ml-2" />
                    </a>
                  ) : (
                    <span>-</span>
                  )
                }
              />
            </div>
          </div>

          {tournaments.length > 0 && (
            <>
              <Info label="Performance" />
              <span className="text-xs">Últimos 12 torneios</span>
              <div className="flex justify-end">
                <Select
                  value={selectedRatingType}
                  onValueChange={(value) => setSelectedRatingType(value)}
                >
                  <SelectTrigger className="w-auto mt-2">
                    <SelectValue placeholder="Selecione o tipo de rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Clássico</SelectItem>
                    <SelectItem value="rapid">Rápido</SelectItem>
                    <SelectItem value="blitz">Blitz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-2">
                <VariationChart
                  player={player}
                  selectedRatingType={selectedRatingType}
                />
                <TotalRatingChart
                  player={player}
                  selectedRatingType={selectedRatingType}
                />
              </div>
            </>
          )}

          {tournaments && (
            <div className="mt-3">
              <Info label="Torneios">
                <div className="w-[450px] max-w-[calc(100vw-10%)]">
                  <DataTable columns={columns} data={tournaments} />
                </div>
              </Info>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerModal;

const Info = ({
  label,
  content,
  children,
}: {
  label: string;
  content?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div>
      <h3 className="text-sm text-muted-foreground mt-3">{label}</h3>
      {content && <p>{content}</p>}
      {children}
    </div>
  );
};

interface RatingCardProps {
  label: string;
  rating?: number | null | undefined;
  link?: ReactNode;
}

const RatingCard = ({ label, rating, link }: RatingCardProps) => {
  return (
    <div className="text-center p-4 rounded-md bg-primary-foreground mt-2">
      <p className="text-sm">{label}</p>
      <p className="font-medium mt-2">{rating}</p>
      {link}
    </div>
  );
};

const extractChartData = (player: PlayerById, selectedRatingType: string) => {
  return (
    player.playersToTournaments
      ?.filter(
        (tournament: { ratingType: string }) =>
          tournament.ratingType === selectedRatingType
      )
      .reverse()
      .slice(0, 12)
      .reverse()
      .map((tournament) => ({
        name: tournament.tournament.name,
        variation: tournament.variation,
      })) || []
  );
};

const extractTotalRatingData = (
  player: PlayerById,
  selectedRatingType: string
) => {
  let previousTotalRating: number | null = null;
  return (
    player.playersToTournaments
      ?.filter(
        (tournament: { ratingType: string }) =>
          tournament.ratingType === selectedRatingType
      )
      .reverse()
      .slice(0, 12)
      .reverse()
      .map((tournament) => {
        const totalRating = tournament.oldRating + tournament.variation;
        const previousTotalRatingCopy = previousTotalRating;
        previousTotalRating = totalRating;
        return {
          name: tournament.tournament.name,
          totalRating,
          previousTotalRating: previousTotalRatingCopy,
        };
      }) || []
  );
};

const getFillColorVariation = (
  variation: number,
  isHighest: boolean,
  isLowest: boolean
) => {
  if (isHighest && variation > 0) {
    return "var(--chart-5)";
  }

  if (isLowest && variation < 0) {
    return "var(--chart-6)";
  }

  if (variation < -20) {
    return "var(--chart-3)";
  }
  if (variation < 0) {
    return "var(--chart-4)";
  }
  if (variation >= 20) {
    return "var(--chart-1)";
  }
  return "var(--chart-2)";
};

const chartConfig = {
  variation: {
    label: "Variação",
    color: "var(--chart-5)",
  },
  totalRating: {
    label: "Evolução do rating",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function VariationChart({
  player,
  selectedRatingType,
}: {
  player: PlayerById;
  selectedRatingType: string;
}) {
  const chartData = extractChartData(player, selectedRatingType);

  if (chartData.length === 0) {
    return (
      <div className="text-center text-muted-foreground mt-2 text-sm">
        Nenhum dado de variação disponível para este tipo de rating.
      </div>
    );
  }

  const maxVariation = Math.max(
    ...chartData.map((entry: { variation: number }) => entry.variation)
  );
  const minVariation = Math.min(
    ...chartData.map((entry: { variation: number }) => entry.variation)
  );

  const hasPositiveVariations = maxVariation > 0;
  const hasNegativeVariations = minVariation < 0;

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 24,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 0)}
        />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <ChartLegend content={<ChartLegendContent className="-mt-6" />} />
        <Bar dataKey="variation" fill="var(--chart-5)" radius={4}>
          {chartData.map((entry: { name: string; variation: number }) => (
            <Cell
              key={`${entry.name}-${entry.variation}`}
              fill={getFillColorVariation(
                entry.variation,
                hasPositiveVariations && entry.variation === maxVariation,
                hasNegativeVariations && entry.variation === minVariation
              )}
            />
          ))}
          <LabelList
            position="top"
            offset={12}
            className="fill-foreground"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function TotalRatingChart({
  player,
  selectedRatingType,
}: {
  player: PlayerById;
  selectedRatingType: string;
}) {
  const chartData = extractTotalRatingData(player, selectedRatingType);

  if (chartData.length === 0) {
    return <div />;
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="min-h-[200px] w-[calc(100%+32px)] mt-4 -translate-x-4"
    >
      <LineChart
        data={chartData}
        margin={{
          top: 24,
          left: 16,
          right: 16,
        }}
      >
        <CartesianGrid key="cartesian-grid" vertical={false} />
        <XAxis
          key="x-axis"
          dataKey="name"
          tickLine={false}
          tickMargin={8}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 0)}
        />
        <YAxis
          key="y-axis"
          domain={["auto", "auto"]}
          tickLine={false}
          axisLine={false}
          width={0}
        />
        <ChartTooltip
          key="chart-tooltip"
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <ChartLegend
          key="chart-legend"
          content={<ChartLegendContent className="-mt-6" />}
        />
        <Line
          key="total-rating-line"
          dataKey="totalRating"
          type="natural"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={(props) => {
            return (
              <circle
                key={`dot-${props.cx}-${props.cy}`}
                cx={props.cx}
                cy={props.cy}
                r={4}
                stroke="none"
                fill="var(--chart-1)"
              />
            );
          }}
          activeDot={{
            r: 6,
          }}
        >
          <LabelList
            key="label-list"
            position="top"
            offset={12}
            className="fill-foreground"
            fontSize={12}
          />
        </Line>
      </LineChart>
    </ChartContainer>
  );
}
