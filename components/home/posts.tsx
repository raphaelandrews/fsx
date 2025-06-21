import { NewspaperIcon } from "lucide-react";

import type { FreshPost } from "@/db/queries";

import { Section } from "./section";
import { PostCard } from "@/components/post-card";

interface PostsSectionProps {
  posts: FreshPost[];
}

export function Posts({ posts }: PostsSectionProps) {
  const freshPosts = posts.slice(2, 6);

  return (
    <Section
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
            image={posts.image ?? null}
            title={posts.title}
            slug={posts.slug ?? null}
          />
        ))}
      </div>
    </Section>
  );
}
