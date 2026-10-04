import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { AchievementBadge } from "@/components/gamification/achievement-badge";
import { ActivityHeatmap } from "@/components/gamification/activity-heatmap";
import { Medal } from "@/components/gamification/medal";
import { StatTile } from "@/components/gamification/stat-tile";
import { orNotFound } from "@/lib/errors";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/utils/trpc";

// The federation's calendar year; a future season has nothing to show.
const currentYear = () =>
  Number(new Intl.DateTimeFormat("en", { timeZone: "America/Sao_Paulo", year: "numeric" }).format(new Date()));

const FORMATS = [
  ["classic", "Clássico"],
  ["rapid", "Rápido"],
  ["blitz", "Blitz"],
] as const;

const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

export const Route = createFileRoute("/_public/jogadores/$id/temporada/$ano")({
  params: {
    parse: ({ ano }: { ano: string }): { ano: number } => {
      const year = Number(ano);
      if (!/^\d{4}$/.test(ano) || year < 1900 || year > currentYear()) throw notFound();
      return { ano: year };
    },
    stringify: ({ ano }: { ano: number }) => ({ ano: String(ano) }),
  },
  loader: ({ context, params }) =>
    orNotFound(context.queryClient.ensureQueryData(context.trpc.players.season.queryOptions({ id: params.id, year: params.ano }))),
  head: ({ loaderData }) => {
    if (!loaderData) return buildSeo({ title: withBrand("Temporada"), path: "/ratings", noindex: true });
    const name = loaderData.player.nickname || loaderData.player.name;
    const path = `/jogadores/${loaderData.player.id}/temporada/${loaderData.year}`;
    return buildSeo({
      title: withBrand(`Temporada ${loaderData.year} de ${name}`),
      description: `${name} em ${loaderData.year}: ${loaderData.tournamentsPlayed} torneios, variação de rating, pódios e conquistas no xadrez sergipano.`,
      path,
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name, path: `/jogadores/${loaderData.player.id}` },
        { name: `Temporada ${loaderData.year}`, path },
      ]),
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { id, ano } = Route.useParams();
  const { data: season } = useSuspenseQuery(trpc.players.season.queryOptions({ id, year: ano }));
  const name = season.player.nickname || season.player.name;
  const index = season.seasons.indexOf(season.year);
  const previous = season.seasons[index - 1];
  const next = season.seasons[index + 1];

  return (
    <div className="mx-auto max-w-[720px] py-8">
      <header className="mb-6 text-center">
        <p className="text-muted-foreground text-sm">
          <Link to="/jogadores/$id" params={{ id }} className="hover:underline">
            {name}
          </Link>
        </p>
        <h1 className="font-semibold text-3xl tracking-tight">Temporada {season.year}</h1>
        <nav aria-label="Outras temporadas" className="mt-2 flex justify-center gap-4 text-sm">
          {previous && (
            <Link to="/jogadores/$id/temporada/$ano" params={{ id, ano: previous }} className="hover:underline">
              ← {previous}
            </Link>
          )}
          {next && (
            <Link to="/jogadores/$id/temporada/$ano" params={{ id, ano: next }} className="hover:underline">
              {next} →
            </Link>
          )}
        </nav>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Torneios" value={season.tournamentsPlayed} />
        <StatTile
          label="Melhor desempenho"
          value={season.bestGain ? `+${season.bestGain.variation}` : "—"}
          hint={season.bestGain ? season.tournaments[season.bestGain.tournamentId]?.name : undefined}
        />
        <StatTile label="XP no ano" value={`+${season.xpGained}`} hint={`nível ${season.level} ao fim do ano`} />
        <StatTile label="Pódios" value={season.podiums.length} />
      </div>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold text-sm">Variação de rating</h2>
        <div className="grid grid-cols-3 gap-2">
          {FORMATS.map(([format, label]) => (
            <StatTile
              key={format}
              label={label}
              value={season.ratingChange[format] === null ? "—" : signed(season.ratingChange[format]!)}
            />
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-semibold text-sm">Torneios por mês</h2>
        <ActivityHeatmap rows={[{ year: season.year, months: season.months }]} />
      </section>

      {season.podiums.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 font-semibold text-sm">Pódios</h2>
          <ul className="space-y-2">
            {season.podiums.map((podium) => (
              <li key={`${podium.name}-${podium.category}-${podium.place}`} className="flex items-center gap-2 text-sm">
                <Medal place={podium.place as 1 | 2 | 3} />
                <span>
                  {podium.name}
                  {podium.category && <span className="text-muted-foreground"> · {podium.category}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {season.achievements.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold text-sm">Conquistas do ano</h2>
          <ul className="flex flex-wrap gap-2" aria-label="Conquistas do ano">
            {season.achievements.map((achievement) => (
              <li key={achievement.id}>
                <AchievementBadge achievement={achievement} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
