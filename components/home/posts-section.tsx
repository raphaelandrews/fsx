import { FlameIcon, NewspaperIcon } from "lucide-react";

import type { FreshPost } from "@/db/queries";
import { HomeSection } from "@/components/home/home-section";
import { PostCard } from "@/components/post-card";

interface PostsSectionProps {
  posts: FreshPost[];
}

export function PostsSection({ posts }: PostsSectionProps) {
  const mainPosts = posts.slice(0, 2);
  const freshPosts = posts.slice(2, 6);

  return (
    <>
      <HomeSection
        icon={FlameIcon}
        main={true}
        className="!mt-4"
      >
        <div className="grid sm:grid-cols-2 gap-8">
          {mainPosts?.map((posts: FreshPost) => (
            <PostCard
              key={posts.id}
              id={posts.id}
              image={posts.image ?? ""}
              title={posts.title}
              slug={posts.slug ?? ""}
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
          {freshPosts?.map((posts: FreshPost) => (
            <PostCard
              key={posts.id}
              id={posts.id}
              image={posts.image ?? ""}
              title={posts.title}
              slug={posts.slug ?? ""}
            />
          ))}
        </div>
      </HomeSection>
    </>
  );
}
