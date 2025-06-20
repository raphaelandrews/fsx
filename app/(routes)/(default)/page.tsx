import {
  getFreshAnnouncements,
  getFreshPosts,
  getTopPlayers,
} from "@/db/queries";

import { AnnouncementsSection } from "@/components/home/announcements-section";
import { DataTableTabs } from "@/components/home/ratings/data-table-tabs";
import { FAQ } from "@/components/home/faq";
import { PostsSection } from "@/components/home/posts-section";

export default async function Page() {
  const [posts, announcements, topPlayers] = await Promise.all([
    getFreshPosts(),
    getFreshAnnouncements(),
    getTopPlayers(),
  ]);

  return (
    <>
      <PostsSection posts={posts} />
      <DataTableTabs topPlayers={topPlayers} />
      <AnnouncementsSection announcements={announcements} />
      <FAQ />
    </>
  );
}
