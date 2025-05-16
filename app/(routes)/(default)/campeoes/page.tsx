import type { Metadata } from "next";
import { TrophyIcon } from "lucide-react";

import { getChampions } from "@/db/queries";
import { siteConfig } from "@/lib/site";

import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";
import { Announcement } from "@/components/announcement";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "Galeria de Campeões",
  description: "Campeões dos Campeonatos Sergipanos",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${siteConfig.url}/campeoes`,
    title: "FSX | Galeria de Campeões",
    description: "Galeria de Campeões Sergipanos de Xadrez",
    siteName: "FSX | Galeria de Campeões",
    images: [
      {
        url: `${siteConfig.url}/og/og-campeoes.jpg`,
        width: 1920,
        height: 1080,
      },
    ],
  },
};

const ChampionsPage = async () => {
  const data = await getChampions();

  const transformedData = data.map((championship) => ({
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
            data={transformedData[0].tournaments.reverse()}
          />
        </TabsContent>
        <TabsContent value="rapid">
          <DataTable
            columns={columns}
            data={transformedData[1].tournaments.reverse()}
          />
        </TabsContent>
        <TabsContent value="blitz">
          <DataTable
            columns={columns}
            data={transformedData[2].tournaments.reverse()}
          />
        </TabsContent>
        <TabsContent value="female">
          <DataTable
            columns={columns}
            data={transformedData[3].tournaments.reverse()}
          />
        </TabsContent>
        <TabsContent value="team">
          <DataTable
            columns={columns}
            data={transformedData[4].tournaments.reverse()}
          />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default ChampionsPage;
