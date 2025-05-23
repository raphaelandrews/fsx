import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";

import type { FreshPost } from "~/db/queries";
import { Skeleton } from "~/components/ui/skeleton";

interface PostsCardProps extends FreshPost {
  main?: boolean;
  onMouseEnter?: () => void;
}

export function PostCard({
  title,
  image,
  slug,
  main,
  onMouseEnter,
}: PostsCardProps) {
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = image ?? "";
    img.onload = () => {
      setImageLoaded(true);
      setLoading(false);
    };
    img.onerror = () => {
      setLoading(false);
    };

    const timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 2500);

    return () => clearTimeout(timeout);
  }, [image, loading]);

  if (loading) {
    return (
      <div>
        <Skeleton className="w-full aspect-[2/1]" />
        <Skeleton className="h-5 w-full mt-2 mb-1" />
        <Skeleton className="h-5 w-4/5" />
      </div>
    );
  }

  return (
    <Link
      to="/noticias/$noticiaSlug"
      params={{ noticiaSlug: slug }}
      className="group"
      aria-label={`Read post: ${title}`}
      onMouseEnter={onMouseEnter}
    >
      <img
        src={image}
        alt={title}
        className="w-full aspect-[2/1] rounded-md object-cover transition-opacity duration-300"
        style={{ opacity: imageLoaded ? 1 : 0 }}
        loading="lazy"
        decoding="async"
      />
      <h2
        className={`${main ? "font-medium md:text-xl tracking-tight" : "font-normal text-sm leading-5"} mt-2 line-clamp-2`}
      >
        {title}
      </h2>
    </Link>
  );
}
