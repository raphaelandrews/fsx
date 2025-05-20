import { FlameIcon, NewspaperIcon } from "lucide-react";

import type { FreshNews } from "~/db/queries";
import { HomeSection } from "~/components/home/home-section";
import { NewsCard } from "~/components/news-card";

interface NewsSectionProps {
  news: FreshNews[];
}

export function NewsSection({ news }: NewsSectionProps) {
  const mainNews = news.slice(0, 2);
  const freshNews = news.slice(2, 6);

  return (
    <>
      <HomeSection
        label=""
        href=""
        icon={FlameIcon}
        main={true}
        className="!mt-4"
      >
        <div className="grid sm:grid-cols-2 gap-8">
          {mainNews?.map((news: FreshNews) => (
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
        href="/noticias"
        icon={NewspaperIcon}
        main={false}
      >
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {freshNews?.map((news: FreshNews) => (
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
    </>
  );
}
