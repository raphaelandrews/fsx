import {
  BarChart2Icon,
  FileQuestionIcon,
  FlameIcon,
  MegaphoneIcon,
  NewspaperIcon,
} from "lucide-react";

import {
  getFreshAnnouncements,
  getFreshNews,
  getTopPlayers,
} from "@/db/queries";

import { FAQ } from "../../../components/faq";
import { HomeSection } from "../../../components/home-section";
import { UpdateRegister } from "../../../components/update-register";
import { AnnouncementLink } from "@/components/announcement-link";
import { NewsCard } from "@/components/news-card";
import DataTableTabs from "@/components/ratings-main/data-table-tabs";

export default async function Page() {
  const [newsQuery, announcementsQuery, topPlayers] = await Promise.all([
    getFreshNews(),
    getFreshAnnouncements(),
    getTopPlayers(),
  ]);

  const mainNews = newsQuery.slice(0, 2);
  const freshNews = newsQuery.slice(2, 6);
  const announcements = announcementsQuery;

  return (
    <>
      <UpdateRegister />

      <HomeSection icon={FlameIcon} main={true} className="!mt-4">
        <div className="grid sm:grid-cols-2 gap-8">
          {mainNews.map((news) => (
            <NewsCard
              key={news.id}
              id={news.id}
              image={news.image ?? ""}
              title={news.title}
              slug={news.slug ?? ""}
              main={true}
            />
          ))}
        </div>
      </HomeSection>

      <HomeSection label="Notícias" href={"/noticias"} icon={NewspaperIcon}>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {freshNews.map((news) => (
            <NewsCard
              key={news.id}
              id={news.id}
              image={news.image ?? ""}
              title={news.title}
              slug={news.slug ?? ""}
            />
          ))}
        </div>
      </HomeSection>

      <HomeSection label="Rating" href={"/ratings"} icon={BarChart2Icon}>
        <DataTableTabs topPlayers={topPlayers} />
      </HomeSection>

      <HomeSection
        label="Comunicados"
        href={"/comunicados"}
        icon={MegaphoneIcon}
      >
        <div className="grid md:grid-cols-2 gap-2 rounded-md">
          {announcements.map((announcement) => (
            <AnnouncementLink
              key={announcement.number}
              id={announcement.id}
              year={announcement.year}
              number={announcement.number}
              content={announcement.content}
            />
          ))}
        </div>
      </HomeSection>

      <HomeSection label="FAQ" icon={FileQuestionIcon} main={false}>
        <FAQ />
      </HomeSection>
    </>
  );
}
