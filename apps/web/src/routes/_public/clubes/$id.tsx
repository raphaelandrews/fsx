import { Link, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { UserGroupIcon } from "@hugeicons/core-free-icons";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@fsx/ui/components/table";

import { Announcement } from "@/components/announcement";
import { ClubLogo } from "@/components/clubes/club-logo";
import { Medal } from "@/components/gamification/medal";
import { StatTile } from "@/components/gamification/stat-tile";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";
import { orNotFound } from "@/lib/errors";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/utils/trpc";

const FORMATS = [
  ["classic", "Clássico"],
  ["rapid", "Rápido"],
  ["blitz", "Blitz"],
] as const;

export const Route = createFileRoute("/_public/clubes/$id")({
  params: idParams,
  loader: ({ context, params }) =>
    orNotFound(context.queryClient.ensureQueryData(context.trpc.clubs.byId.queryOptions({ id: params.id }))),
  head: ({ loaderData }) => {
    if (!loaderData) return buildSeo({ title: withBrand("Clube"), path: "/clubes", noindex: true });
    const { club, standing } = loaderData;
    const path = `/clubes/${club.id}`;
    return buildSeo({
      title: withBrand(club.name),
      description: `${club.name} no xadrez sergipano: ${standing?.activeMembers ?? 0} jogadores ativos, força por ritmo e quadro de medalhas.`,
      path,
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Clubes", path: "/clubes" },
        { name: club.name, path },
      ]),
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(trpc.clubs.byId.queryOptions({ id }));
  const { club, standing, members } = data;

  return (
    <div className="mx-auto max-w-[720px] pb-12">
      <header className="flex flex-col items-center gap-3 pt-8 pb-6 text-center sm:pt-12 sm:pb-8">
        <ClubLogo name={club.name} logoUrl={club.logoUrl} className="size-20 rounded-2xl" />
        <h1 className="text-balance font-semibold text-3xl tracking-tight sm:text-4xl">{club.name}</h1>
        {standing && (
          <span className="flex gap-1">
            {standing.medals.gold > 0 && <Medal place={1} count={standing.medals.gold} />}
            {standing.medals.silver > 0 && <Medal place={2} count={standing.medals.silver} />}
            {standing.medals.bronze > 0 && <Medal place={3} count={standing.medals.bronze} />}
          </span>
        )}
      </header>

      <div className="grid grid-cols-2 gap-2 px-2 sm:grid-cols-4 sm:gap-4 sm:px-4">
        <StatTile label="Jogadores ativos" value={standing?.activeMembers ?? 0} hint={`${standing?.members ?? 0} no total`} />
        {FORMATS.map(([format, label]) => (
          <StatTile
            key={format}
            label={`Força · ${label}`}
            value={standing?.strength[format] ?? "—"}
            hint={standing?.rank[format] ? `#${standing.rank[format]} entre os clubes` : "menos de 5 ativos"}
          />
        ))}
      </div>

      <section aria-label="Jogadores" className="mt-6">
        <Announcement icon={UserGroupIcon} label="Jogadores" className="text-sm" />
        {members.length === 0 ? (
          <p className="px-3 text-muted-foreground text-sm">Nenhum jogador cadastrado neste clube.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jogador</TableHead>
                {FORMATS.map(([format, label]) => (
                  <TableHead key={format} className="text-center">
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <Link to="/jogadores/$id" params={{ id: member.id }} className="font-medium hover:underline">
                      {member.nickname || member.name}
                    </Link>
                    {!member.active && <span className="ml-1.5 text-muted-foreground text-xs">inativo</span>}
                  </TableCell>
                  {FORMATS.map(([format]) => (
                    <TableCell key={format} className="text-center tabular-nums">
                      {member[format]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
