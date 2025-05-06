import React from "react";
import {
  useQueryErrorResetBoundary,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  createFileRoute,
  ErrorComponent,
  type ErrorComponentProps,
  Link,
  useRouter,
} from "@tanstack/react-router";
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
import { ExternalLink, VerifiedIcon } from "lucide-react";

import { formatDefendingChampions } from "~/lib/defending-champions";
import { FormatPodium, FormatPodiumTitle } from "~/lib/format-podium";
import { getGradient } from "~/lib/generate-gradients";

import { columns } from "~/components/modals/columns";
import { DataTable } from "~/components/modals/data-table";

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

import { type PlayerById, playerByIdQueryOptions } from "~/db/queries";

export const Route = createFileRoute("/_id/jogadores/$jogadorId")({
  loader: ({ context: { queryClient }, params: { jogadorId } }) => {
    return queryClient.ensureQueryData(
      playerByIdQueryOptions(Number(jogadorId))
    );
  },
  errorComponent: PlayerErrorComponent,
  component: PlayerComponent,
});

export function PlayerErrorComponent({ error }: ErrorComponentProps) {
  const router = useRouter();
  if (error) {
    return <div>{error.message}</div>;
  }

  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  React.useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          router.invalidate();
        }}
      >
        retry
      </button>
      <ErrorComponent error={error} />
    </div>
  );
}

function PlayerComponent() {
  const playerId = Route.useParams().jogadorId;
  const { data: player } = useSuspenseQuery(
    playerByIdQueryOptions(Number(playerId))
  );

  const useGradients = () => {
    const [headerGradient, avatarGradient] = React.useMemo(
      () => [getGradient(), getGradient()],
      []
    );

    return { headerGradient, avatarGradient };
  };
  const { headerGradient, avatarGradient } = useGradients();

  const orderPodiums = React.useMemo(() => {
    return player?.tournamentPodiums
      ? [...player.tournamentPodiums].reverse()
      : [];
  }, [player?.tournamentPodiums]);

  const tournaments = React.useMemo(() => {
    return player?.playersToTournaments
      ? [...player.playersToTournaments].reverse()
      : [];
  }, [player?.playersToTournaments]);

  const managementRole = React.useMemo(() => {
    return player?.playersToRoles?.find(
      (role) => role.role.type === "management"
    );
  }, [player?.playersToRoles]);

  const refereeRole = React.useMemo(() => {
    return player?.playersToRoles?.find((role) => role.role.type === "referee");
  }, [player?.playersToRoles]);

  const internalTitle = React.useMemo(() => {
    return player?.playersToTitles?.find(
      (title) => title.title.type === "internal"
    );
  }, [player?.playersToTitles]);

  const externalTitle = React.useMemo(() => {
    return player?.playersToTitles?.find(
      (title) => title.title.type === "external"
    );
  }, [player?.playersToTitles]);

  const [selectedRatingType, setSelectedRatingType] = React.useState("rapid");

  return (
    <section className="w-11/12 max-w-[500px] m-auto pt-12 pb-20">
      <div className="mb-12">
        <div className="w-full h-32 rounded-md" style={headerGradient} />
        <Avatar className="absolute w-20 h-20 rounded-[10px] border-4 border-background left-1/2 -translate-y-1/2 -translate-x-1/2">
          <AvatarImage src={player.imageUrl ?? ""} alt={player.name} />
          <AvatarFallback style={avatarGradient} />
        </Avatar>
      </div>

      <div className="flex justify-center items-center gap-1">
        <h2 className="font-medium text-lg text-center mt-1">
          {internalTitle && (
            <span className="text-gold">{internalTitle.title.shortTitle} </span>
          )}
          {player.nickname ? player.nickname : player.name}
        </h2>

        {player.verified && (
          <Popover>
            <PopoverTrigger asChild className="hover:cursor-pointer">
              <VerifiedIcon
                className="!fill-[#1CA0F2] dark:stroke-[1.5] stroke-background mt-1"
                aria-label="Verificado"
              />
            </PopoverTrigger>
            <PopoverContent>
              <p className="text-primary font-semibold">Perfil verificado</p>
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

      {player.defendingChampions && player.defendingChampions?.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 mt-8">
          {player.defendingChampions?.map((championship) => (
            <div key={championship.championship.name}>
              {formatDefendingChampions(championship.championship.name, 20)}
            </div>
          ))}
        </div>
      )}

      {orderPodiums.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 mt-8">
          {orderPodiums.map((podium) => (
            <Popover key={podium.place + podium.tournament.name}>
              <PopoverTrigger className="text-primary p-2 rounded-md bg-muted dark:bg-primary-foreground/60">
                {FormatPodium(
                  podium.place,
                  podium.tournament.championshipId ?? 0
                )}
              </PopoverTrigger>
              <PopoverContent className="text-center max-w-72">
                {FormatPodiumTitle(podium.place)} {podium.tournament.name}
              </PopoverContent>
            </Popover>
          ))}
        </div>
      )}

      {!managementRole &&
        !refereeRole &&
        orderPodiums.length <= 0 &&
        player.defendingChampions &&
        player.defendingChampions?.length <= 0 && <div className="pt-3" />}

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

        {player.club && (
          <Info label="Clube">
            <div className="flex items-center gap-2">
              <img
                src={
                  player.club.logo
                    ? player.club.logo
                    : "https://raw.githubusercontent.com/raphaelandrews/fsx-db/main/logo-bg.png"
                }
                alt={player.club.name}
                title={player.club.name}
                className="w-4 h-4 rounded object-contain"
                width={16}
                height={16}
              />
              <p>{player.club.name}</p>
            </div>
          </Info>
        )}

        {player.location && (
          <Info label="Local">
            <div className="flex items-center gap-2">
              <img
                src={player.location.flag ? player.location.flag : ""}
                alt={player.location.name}
                title={player.location.name}
                width={16}
                height={16}
                className="w-4 h-4 rounded object-contain"
              />
              <p>{player.location?.name}</p>
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
            <DataTable columns={columns} data={tournaments} />
          </Info>
        </div>
      )}
    </section>
  );
}

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
  link?: React.ReactNode;
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
      ?.filter((tournament) => tournament.ratingType === selectedRatingType)
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
      ?.filter((tournament) => tournament.ratingType === selectedRatingType)
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
