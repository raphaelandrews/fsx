import { useQuery } from "@tanstack/react-query";
import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { TrophyIcon } from "lucide-react";

import { championsQueryOptions } from "~/db/queries";
import { siteConfig } from "~/utils/config";

import { columns } from "~/components/champions/columns";
import { DataTable } from "~/components/champions/data-table";
import { Announcement } from "~/components/announcement";
import { NotFound } from "~/components/not-found";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "~/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export const Route = createFileRoute("/_default/campeoes/")({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(championsQueryOptions());
  },
  head: () => ({
    meta: [
      {
        title: `Galeria de Campeões | ${siteConfig.name}`,
        description: "Campeões Sergipanos",
        ogUrl: `${siteConfig.url}/campeoes`,
        image: `${siteConfig.url}/og/og-campeoes.jpg`,
      },
    ],
  }),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <NotFound />,
  component: RouteComponent,
});

function RouteComponent() {
  const { data, error } = useQuery(championsQueryOptions());

  if (error) {
    return <ErrorComponent error={error} />;
  }

  const champions = data ? data : [];

  const transformedData = champions.map((championship) => ({
    ...championship,
    tournaments: championship.tournaments.map((tournament) => ({
      ...tournament,
      date: tournament.date ? new Date(tournament.date) : null,
      tournamentPodiums: tournament.tournamentPodiums.map((podium) => ({
        place: podium.place,
        player: {
          id: Number(podium.player.id),
          name: podium.player.name,
          nickname: podium.player.nickname ?? null,
          imageUrl: podium.player.imageUrl ?? null,
          location: podium.player.location ?? null,
          playersToTitles: podium.player.playersToTitles.map((t) => ({
            title: {
              type: t.title.type,
              shortTitle: t.title.shortTitle,
            },
          })),
        },
      })),
    })),
  }));

  return (
    <>
      <PageHeader>
        <Announcement icon={TrophyIcon} />
        <PageHeaderHeading>Campeões</PageHeaderHeading>
        <PageHeaderDescription>
          Galeria dos campeões sergipanos.
        </PageHeaderDescription>
      </PageHeader>

      <Tabs defaultValue="classic">
        <TabsList className="grid h-20 sm:h-[inherit] sm:w-[500px] grid-cols-3 grid-rows-2 sm:grid-cols-5 sm:grid-rows-1">
          <TabsTrigger value="classic">Absoluto</TabsTrigger>
          <TabsTrigger value="rapid">Rápido</TabsTrigger>
          <TabsTrigger value="blitz">Blitz</TabsTrigger>
          <TabsTrigger value="female">Feminino</TabsTrigger>
          <TabsTrigger value="team">Equipes</TabsTrigger>
        </TabsList>

        <TabsContent value="classic">
          <DataTable
            columns={columns}
            data={
              transformedData
                .find((c) => c.name === "Absoluto")
                ?.tournaments.reverse() ?? []
            }
          />
        </TabsContent>
        <TabsContent value="rapid">
          <DataTable
            columns={columns}
            data={
              transformedData
                .find((c) => c.name === "Rápido")
                ?.tournaments.reverse() ?? []
            }
          />
        </TabsContent>
        <TabsContent value="blitz">
          <DataTable
            columns={columns}
            data={
              transformedData
                .find((c) => c.name === "Blitz")
                ?.tournaments.reverse() ?? []
            }
          />
        </TabsContent>
        <TabsContent value="female">
          <DataTable
            columns={columns}
            data={
              transformedData
                .find((c) => c.name === "Feminino")
                ?.tournaments.reverse() ?? []
            }
          />
        </TabsContent>
        <TabsContent value="team">
          <DataTable
            columns={columns}
            data={
              transformedData
                .find((c) => c.name === "Equipes")
                ?.tournaments.reverse() ?? []
            }
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
