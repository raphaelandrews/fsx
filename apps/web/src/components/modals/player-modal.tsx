import { type ReactNode, useEffect, useMemo, useState } from "react";

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

import { getPlayer } from "@/actions/get-players";
import type { PlayerProfileType } from "@/types";
import { formatDefendingChampions } from "@/lib/defending-champions";
import { FormatPodium, FormatPodiumTitle } from "@/lib/format-podium";
import { getGradient } from "@/lib/generate-gradients";

import { columns } from "./columns";
import { DataTable } from "./data-table";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";

interface Props {
  id: number;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const PlayerModal = ({ id, open, setOpen }: Props) => {
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<PlayerProfile | undefined>();

  const useGradients = () => {
    const [headerGradient, avatarGradient] = useMemo(
      () => [getGradient(), getGradient()],
      []
    );

    return { headerGradient, avatarGradient };
  };
  const { headerGradient, avatarGradient } = useGradients();

  const orderPodiums = useMemo(() => {
    return player?.tournament_podiums
      ? [...player.tournament_podiums].reverse()
      : [];
  }, [player?.tournament_podiums]);

  const tournaments = useMemo(() => {
    return player?.players_to_tournaments
      ? [...player.players_to_tournaments].reverse()
      : [];
  }, [player?.players_to_tournaments]);

  const managementRole = useMemo(() => {
    return player?.players_to_roles?.find(
      (role) => role.roles.type === "management"
    );
  }, [player?.players_to_roles]);

  const refereeRole = useMemo(() => {
    return player?.players_to_roles?.find(
      (role) => role.roles.type === "referee"
    );
  }, [player?.players_to_roles]);

  const internalTitle = useMemo(() => {
    return player?.players_to_titles?.find(
      (title) => title.titles.type === "internal"
    );
  }, [player?.players_to_titles]);

  const externalTitle = useMemo(() => {
    return player?.players_to_titles?.find(
      (title) => title.titles.type === "external"
    );
  }, [player?.players_to_titles]);

  const [selectedRatingType, setSelectedRatingType] = useState("rapid");

  const fetchPlayer = async (id: number) => {
    try {
      const response = await getPlayer(id);
      setPlayer(response);
      setLoading(false);
    } catch (error) {
      alert("Ops, ocorreu algum erro");
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    fetchPlayer(id);
  }, []);

  if (!player) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="[&>button#close-dialog]:top-1 [&>button#close-dialog]:right-1 gap-0 w-[90%] max-w-[500px] h-[80vh] overflow-y-auto overflow-x-hidden">
        <div className="max-w-[calc(100vw-10%-3rem+2px)]">
          {loading ? (
            <div className="relative flex flex-col items-center gap-6 h-[80vh]">
              <Skeleton className="h-20 w-20 rounded-full mt-8" />
              <Skeleton className="w-[250px] h-8" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="relative mb-12">
                  <div
                    className="w-full h-32 rounded-md"
                    style={headerGradient}
                  />
                  <Avatar className="absolute w-20 h-20 rounded-[10px] border-4 border-background left-1/2 -translate-y-1/2 -translate-x-1/2">
                    <AvatarImage
                      src={player.image_url ?? ""}
                      alt={player.name}
                    />
                    <AvatarFallback style={avatarGradient} />
                  </Avatar>
                </div>
                <div className="flex justify-center items-center gap-1">
                  <DialogTitle className="text-center mt-1">
                    {internalTitle && (
                      <span className="text-gold">
                        {internalTitle.titles.short_title}{" "}
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
                    <Badge variant="default">{managementRole.roles.role}</Badge>
                  )}
                  {refereeRole && (
                    <Badge variant="default">{refereeRole.roles.role}</Badge>
                  )}
                </div>
              )}

              {orderPodiums.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-8">
                  {orderPodiums.map((podium) => (
                    <Popover key={podium.place + podium.tournaments.name}>
                      <PopoverTrigger className="text-primary p-2 rounded-md bg-primary-foreground/60">
                        {FormatPodium(
                          podium.place,
                          podium.tournaments.championship_id
                        )}
                      </PopoverTrigger>
                      <PopoverContent className="text-center max-w-72">
                        {FormatPodiumTitle(podium.place)}{" "}
                        {podium.tournaments.name}
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
                    {internalTitle && <p>{internalTitle.titles.title}</p>}
                  </Info>
                )}

                {externalTitle && (
                  <Info label="Titulação CBX/FIDE">
                    {externalTitle && <p>{externalTitle.titles.title}</p>}
                  </Info>
                )}

                {player.clubs && (
                  <Info label="Clube">
                    <div className="flex items-center gap-2">
                      <Image
                        src={
                          player.clubs.logo
                            ? player.clubs.logo
                            : "https://raw.githubusercontent.com/raphaelandrews/fsx-db/main/logo-bg.png"
                        }
                        alt={player.clubs.name}
                        title={player.clubs.name}
                        className="w-4 h-4 rounded object-contain"
                        width={16}
                        height={16}
                      />
                      <p>{player.clubs.name}</p>
                    </div>
                  </Info>
                )}

                {player.locations && (
                  <Info label="Local">
                    <div className="flex items-center gap-2">
                      <Image
                        src={player.locations.flag ? player.locations.flag : ""}
                        alt={player.locations.name}
                        title={player.locations.name}
                        width={16}
                        height={16}
                        className="w-4 h-4 rounded object-contain"
                      />
                      <p>{player.locations?.name}</p>
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
                      player.cbx_id ? (
                        <Link
                          href={`https://www.cbx.org.br/jogador/${player.cbx_id}`}
                          target="_blank"
                          className="flex justify-center text-primary hover:underline transition"
                        >
                          {player.cbx_id} <ExternalLink className="w-4 ml-2" />
                        </Link>
                      ) : (
                        <span>-</span>
                      )
                    }
                  />
                  <RatingCard
                    label="FIDE"
                    link={
                      player.fide_id ? (
                        <Link
                          href={`https://ratings.fide.com/profile/${player.fide_id}`}
                          target="_blank"
                          className="flex justify-center text-primary hover:underline transition"
                        >
                          {player.fide_id} <ExternalLink className="w-4 ml-2" />
                        </Link>
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
            </>
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

const extractChartData = (
  player: PlayerProfile,
  selectedRatingType: string
) => {
  return (
    player.players_to_tournaments
      ?.filter((tournament) => tournament.rating_type === selectedRatingType)
      .reverse()
      .slice(0, 12)
      .reverse()
      .map((tournament) => ({
        name: tournament.tournaments.name,
        variation: tournament.variation,
      })) || []
  );
};

const extractTotalRatingData = (
  player: PlayerProfile,
  selectedRatingType: string
) => {
  let previousTotalRating: number | null = null;
  return (
    player.players_to_tournaments
      ?.filter((tournament) => tournament.rating_type === selectedRatingType)
      .reverse()
      .slice(0, 12)
      .reverse()
      .map((tournament) => {
        const totalRating = tournament.old_rating + tournament.variation;
        const previousTotalRatingCopy = previousTotalRating;
        previousTotalRating = totalRating;
        return {
          name: tournament.tournaments.name,
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
    return "hsl(var(--chart-5))";
  }

  if (isLowest && variation < 0) {
    return "hsl(var(--chart-6))";
  }

  if (variation < -20) {
    return "hsl(var(--chart-3))";
  }
  if (variation < 0) {
    return "hsl(var(--chart-4))";
  }
  if (variation >= 20) {
    return "hsl(var(--chart-1))";
  }
  return "hsl(var(--chart-2))";
};

const chartConfig = {
  variation: {
    label: "Variação",
    color: "hsl(var(--chart-5))",
  },
  totalRating: {
    label: "Evolução do rating",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export function VariationChart({
  player,
  selectedRatingType,
}: {
  player: PlayerProfile;
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

  const maxVariation = Math.max(...chartData.map((entry) => entry.variation));
  const minVariation = Math.min(...chartData.map((entry) => entry.variation));

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
        <Bar dataKey="variation" fill="hsl(var(--chart-5))" radius={4}>
          {chartData.map((entry) => (
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
  player: PlayerProfile;
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
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={8}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 0)}
        />
        <YAxis
          domain={["auto", "auto"]}
          tickLine={false}
          axisLine={false}
          width={0}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <ChartLegend content={<ChartLegendContent className="-mt-6" />} />
        <Line
          dataKey="totalRating"
          type="natural"
          stroke="hsl(var(--chart-1))"
          strokeWidth={2}
          dot={(props) => {
            return (
              <circle
                cx={props.cx}
                cy={props.cy}
                r={4}
                stroke="none"
                fill="hsl(var(--chart-1))"
              />
            );
          }}
          activeDot={{
            r: 6,
          }}
        >
          <LabelList
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
