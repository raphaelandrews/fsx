import { createFileRoute } from "@tanstack/react-router";

import {
  freshAnnouncementsQueryOptions,
  freshPostsQueryOptions,
  topPlayersQueryOptions,
} from "~/db/queries";

import { AnnouncementsSection } from "~/components/home/announcements-section";
import { DataTableTabs } from "~/components/home/ratings/data-table-tabs";
import { FAQ } from "~/components/home/faq";
import { PostsSection } from "~/components/home/posts-section";
import { UpdateRegister } from "~/components/update-register";

export const Route = createFileRoute("/_default/")({
  loader: async ({ context: { queryClient } }) => {
    const [posts, announcements, topPlayers] = await Promise.all([
      queryClient.ensureQueryData(freshPostsQueryOptions()),
      queryClient.ensureQueryData(freshAnnouncementsQueryOptions()),
      queryClient.ensureQueryData(topPlayersQueryOptions()),
    ]);
    return { posts, announcements, topPlayers };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { posts, announcements, topPlayers } = Route.useLoaderData();
  return (
    <>
      <UpdateRegister />
      <PostsSection posts={posts} />
      <DataTableTabs topPlayers={topPlayers} />
      <AnnouncementsSection announcements={announcements} />
      <FAQ />
    </>
  );
}
