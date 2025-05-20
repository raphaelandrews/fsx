import { createFileRoute } from "@tanstack/react-router";

import {
  freshAnnouncementsQueryOptions,
  freshNewsQueryOptions,
  topPlayersQueryOptions,
} from "~/db/queries";

import { AnnouncementsSection } from "~/components/home/announcements-section";
import { DataTableTabs } from "~/components/home/ratings/data-table-tabs";
import { FAQ } from "~/components/home/faq";
import { NewsSection } from "~/components/home/news-section";
import { UpdateRegister } from "~/components/update-register";

export const Route = createFileRoute("/_default/")({
  loader: async ({ context: { queryClient } }) => {
    const [news, announcements, topPlayers] = await Promise.all([
      queryClient.ensureQueryData(freshNewsQueryOptions()),
      queryClient.ensureQueryData(freshAnnouncementsQueryOptions()),
      queryClient.ensureQueryData(topPlayersQueryOptions()),
    ]);
    return { news, announcements, topPlayers };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { news, announcements, topPlayers } = Route.useLoaderData();
  return (
    <>
      <UpdateRegister />
      <NewsSection news={news} />
      <DataTableTabs topPlayers={topPlayers} />
      <AnnouncementsSection announcements={announcements} />
      <FAQ />
    </>
  );
}
