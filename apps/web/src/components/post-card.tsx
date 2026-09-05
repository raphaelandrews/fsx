import { Link } from "@tanstack/react-router";

import { cn } from "@fsx/ui/lib/utils";

interface FreshPost {
  title: string;
  imageUrl: string | null;
  slug?: string;
}

type PostCardProps = FreshPost & {
  main?: boolean;
  onMouseEnter?: () => void;
};

export function PostCard({
  title,
  imageUrl,
  slug,
  main,
  onMouseEnter,
  className,
}: PostCardProps & { className?: string }) {
  return (
    <Link
      aria-label={title}
      className={cn(
        "group flex w-full cursor-pointer flex-col gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      to="/noticias/$slug"
      params={{ slug: slug ?? "" }}
      onMouseEnter={onMouseEnter}
    >
      <div aria-hidden className="relative aspect-video w-full overflow-hidden rounded-md bg-muted select-none">
        {imageUrl ? (
          <img
            alt=""
            className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
            decoding="async"
            loading="lazy"
            src={imageUrl}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-1 px-2">
        <h3
          className={cn(
            "line-clamp-2 font-bold leading-[1.1] text-foreground",
            main ? "text-lg md:text-xl" : "text-[1.1rem]",
          )}
        >
          {title}
        </h3>
      </div>
    </Link>
  );
}
