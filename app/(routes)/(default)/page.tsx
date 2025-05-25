import {
  getFreshAnnouncements,
  getFreshPosts,
  getTopPlayers,
} from "@/db/queries";

import { AnnouncementsSection } from "@/components/announcements-section";
import { DataTableTabs } from "@/components/ratings-main/data-table-tabs";
import { FAQ } from "@/components/faq";
import { PostsSection } from "@/components/posts-section";
import { UpdateRegister } from "@/components/update-register";

export default async function Page() {
  const [posts, announcements, topPlayers] = await Promise.all([
    getFreshPosts(),
    getFreshAnnouncements(),
    getTopPlayers(),
  ]);

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
