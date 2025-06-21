import {
  getEvents,
  getFreshAnnouncements,
  getFreshPosts,
  getTopPlayers,
} from "@/db/queries";

import { AnnouncementsSection } from "@/components/home/announcements-section";
import { EventsSection } from "@/components/home/events-section";
import { FAQ } from "@/components/home/faq";
import { PostsSection } from "@/components/home/posts-section";
import { TopPlayersSection } from "@/components/home/ratings/top-players";

export default async function Page() {
  const [events, posts, announcements, topPlayers] = await Promise.all([
    getEvents(),
    getFreshPosts(),
    getFreshAnnouncements(),
    getTopPlayers(),
  ]);

  return (
    <>
      <EventsSection events={events} />
      <PostsSection posts={posts} />
      <TopPlayersSection topPlayers={topPlayers} />
      <AnnouncementsSection announcements={announcements} />
      <FAQ />
    </>
  );
}
