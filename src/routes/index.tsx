import { useSuspenseQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart2Icon,
  FileQuestionIcon,
  FlameIcon,
  MegaphoneIcon,
  NewspaperIcon,
  type LucideIcon,
} from "lucide-react";

import {
  freshAnnouncementsQueryOptions,
  freshNewsQueryOptions,
  type Announcement as AnnouncementType,
  type FreshNews,
} from "~/db/queries";
import { cn } from "~/lib/utils";

import DataTableTabs from "~/components/ratings-main/data-table-tabs";
import { Announcement } from "~/components/announcement";
import { AnnouncementLink } from "~/components/announcement-link";
import { FAQ } from "~/components/faq";
import { NewsCard } from "~/components/news-card";
import { UpdateRegister } from "~/components/update-register";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(freshNewsQueryOptions()),
      queryClient.ensureQueryData(freshAnnouncementsQueryOptions()),
    ]),
  component: Home,
});

function Home() {
  const [newsQuery, announcementsQuery] = useSuspenseQueries({
    queries: [freshNewsQueryOptions(), freshAnnouncementsQueryOptions()],
  });

  const mainNews = newsQuery.data.slice(0, 2);
  const freshNews = newsQuery.data.slice(2, 6);
  const announcements = announcementsQuery.data;

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
          {mainNews.map((news: FreshNews) => (
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

      <HomeSection
        label="Notícias"
        href={"/noticias"}
        icon={NewspaperIcon}
        main={false}
      >
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {freshNews.map((news: FreshNews) => (
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

      <HomeSection
        label="Rating"
        href={"/ratings"}
        icon={BarChart2Icon}
        main={false}
      >
        <DataTableTabs />
      </HomeSection>

      <HomeSection
        label="Comunicados"
        href={"/comunicados"}
        icon={MegaphoneIcon}
        main={false}
      >
        <div className="grid md:grid-cols-2 gap-1.5">
          {announcements.map((announcement: AnnouncementType) => (
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
