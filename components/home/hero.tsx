import { FlameIcon } from "lucide-react";

import type { FreshPost } from "@/db/queries";

import { Section } from "./section";
import { PostCard } from "@/components/post-card";

interface PostsSectionProps {
  posts: FreshPost[];
}

export function Hero({ posts }: PostsSectionProps) {
  const mainPosts = posts.slice(0, 2);

  return (
    <Section icon={FlameIcon} main={true} className="!mt-4">
      <div className="grid sm:grid-cols-2 gap-8">
        {mainPosts?.map((posts: FreshPost) => (
          <PostCard
            key={posts.id}
            id={posts.id}
            image={posts.image ?? null}
            title={posts.title}
            slug={posts.slug ?? null}
            main={true}
          />
        ))}
      </div>
    </Section>
  );
}
