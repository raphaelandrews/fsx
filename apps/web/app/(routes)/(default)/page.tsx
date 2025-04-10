import type { Metadata } from "next";
import {
  type LucideIcon,
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
} from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { FreshAnnouncements } from "@/schemas/announcements";
import type { FreshNews } from "@/schemas/posts";
import { siteConfig } from "@/utils/site";

import AnnouncementLink from "@/components/announcement-link";
import NewsCard from "@/components/news-card";
import UpdateRegister from "@/components/update-register";
import { Announcement } from "@/components/announcement";
import { Hero } from "@/components/hero";
import { Faq } from "@/components/faq";
import { DataTableTabs } from "@/components/ratings-main/data-table-tabs";
import { TopPlayersSchema } from "@/schemas/players";

export const metadata: Metadata = {
  title: "Home",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: `${siteConfig.url}/og/og.jpg`,
        width: 1920,
        height: 1080,
      },
    ],
  },
};

const Home = async () => {
  const [freshNews, freshAnnouncements, topPlayers] = await Promise.all([
    getFreshNews(),
    getFreshAnnouncements(),
    getTopPlayers(), 
  ]);
  
  return (
    <>
      <UpdateRegister />

      <HomeSection
        label=""
        href={""}
        icon={FlameIcon}
        main={true}
        className="!mt-4"
      >
        <div className="grid sm:grid-cols-2 gap-8">
          {freshNews.slice(0, 2).map((news: FreshNews) => (
            <Hero
              key={news.id}
              id={news.id}
              image={news.image}
              title={news.title}
            />
          ))}
        </div>
      </HomeSection>

      <HomeSection
        label="Notícias"
        href="/noticias/1"
        icon={NewspaperIcon}
        main={false}
      >
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {freshNews.slice(2, 6).map((news: FreshNews) => (
            <NewsCard
              key={news.id}
              id={news.id}
              image={news.image}
              title={news.title}
            />
          ))}
        </div>
      </HomeSection>

      <HomeSection
        label="Rating"
        href={"/ratings"}
        icon={BarChart2Icon}
        main={false}
      >
        <DataTableTabs topPlayers={topPlayers} />
      </HomeSection>

      <HomeSection
        label="Comunicados"
        href="/comunicados/1"
        icon={MegaphoneIcon}
        main={false}
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 rounded-md">
          {freshAnnouncements.map((announcement: FreshAnnouncements) => (
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
        <Faq />
      </HomeSection>
    </>
  );
};

export default Home;

interface HomeSectionProps {
  label?: string;
  className?: string;
  href?: string;
  icon: LucideIcon;
  main: boolean;
  children: React.ReactNode;
}

function HomeSection({
  label,
  className,
  href,
  icon,
  main,
  children,
}: HomeSectionProps) {
  return (
    <section className={cn(className, "my-10")}>
      {!main && <Announcement label={label} href={href} icon={icon} />}

      <div className="mt-3">{children}</div>
    </section>
  );
}
