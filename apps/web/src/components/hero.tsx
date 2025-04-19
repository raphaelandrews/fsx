import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import type { z } from "zod";

import type {
  FreshNews,
} from "@fsx/engine/queries";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

type NewsCardProps = z.infer<typeof FreshNews>

export function Hero({ id, title, image, slug }: NewsCardProps) {
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
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="p-0 overflow-hidden">
          <Skeleton className="w-full aspect-[2/1] rounded-lg" />
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <Skeleton className="h-6 w-full mb-1" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Link
      to="/noticias/$noticiaSlug"
      params={{ noticiaSlug: slug }}
      className="group block"
      aria-label={`Read news: ${title}`}
    >
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="p-0 overflow-hidden">
          {!imageLoaded && (
            <Skeleton className="absolute inset-0 w-full aspect-[2/1] rounded-lg z-10" />
          )}
          <img
            src={image}
            alt={title}
            className="relative w-full aspect-[2/1] object-cover rounded-lg transition-opacity duration-300"
            style={{ opacity: imageLoaded ? 1 : 0 }}
            loading="lazy"
            decoding="async"
          />
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <CardTitle className="font-medium text-lg md:text-xl line-clamp-2 group-hover:underline underline-offset-4">
            {title}
          </CardTitle>
        </CardContent>
      </Card>
    </Link>
  );
}
