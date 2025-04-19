import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import type { z } from "zod";

import type {
  FreshNews,
} from "@fsx/engine/queries";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

type NewsCardProps = z.infer<typeof FreshNews> & {
  onMouseEnter?: () => void;
};

const NewsCard = ({ id, title, image, slug, onMouseEnter }: NewsCardProps) => {
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = image ?? '';
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
      <Card className="flex flex-col gap-2 border-none shadow-none bg-transparent">
        <CardHeader className="p-0 rounded-lg overflow-hidden">
          <Skeleton className="w-full aspect-[2/1]" />
        </CardHeader>
        <CardContent className="p-0">
          <Skeleton className="h-5 w-full mb-1" />
          <Skeleton className="h-5 w-4/5" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Link
      to="/noticias/$noticiaSlug"
      params={{ noticiaSlug: slug }}
      className="group"
      aria-label={`Read news: ${title}`}
      onMouseEnter={onMouseEnter}
    >
      <Card className="flex flex-col gap-2 border-none shadow-none bg-transparent group-hover:opacity-90 transition-opacity">
        <CardHeader className="p-0 rounded-lg overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full aspect-[2/1] object-cover transition-opacity duration-300"
            style={{ opacity: imageLoaded ? 1 : 0 }}
            loading="lazy"
            decoding="async"
          />
        </CardHeader>
        <CardContent className="p-0">
          <CardTitle className="font-normal leading-5 line-clamp-2">
            {title}
          </CardTitle>
        </CardContent>
      </Card>
    </Link>
  );
};

export default NewsCard;
