"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import type { FreshNews } from "@/schemas/posts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function Hero({ id, image, title }: FreshNews) {
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = image || "";
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
    <Link href={`/noticias/${id}`} prefetch={true}>
      <Card className="group border-none shadow-none bg-transparent">
        <CardHeader className="p-0 overflow-hidden">
          {image && (
            <img
              src={image}
              alt={title}
              className="w-full rounded-lg transition-opacity duration-300"
              style={{ opacity: imageLoaded ? 1 : 0 }}
            />
          )}
        </CardHeader>
        <CardContent className="p-0 pt-2">
          <CardTitle className="font-medium md:text-xl line-clamp-2 webkit-line-clamp-2">
            {title}
          </CardTitle>
        </CardContent>
      </Card>
    </Link>
  );
}
