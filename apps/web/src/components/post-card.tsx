
import { useState, useEffect } from "react"
import { Link } from "@tanstack/react-router"

import { cn } from "@fsx/ui/lib/utils"
import { Skeleton } from "@fsx/ui/components/skeleton"

interface FreshPost {
  title: string
  imageUrl: string | null
  slug?: string
}

type PostCardProps = FreshPost & {
  main?: boolean
  onMouseEnter?: () => void
}

export function PostCard({
  title,
  imageUrl,
  slug,
  main,
  onMouseEnter,
  className,
}: PostCardProps & { className?: string }) {
  const [loading, setLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.src = imageUrl ?? ""
    img.onload = () => {
      setImageLoaded(true)
      setLoading(false)
    }
    img.onerror = () => {
      setLoading(false)
    }

    const timeout = setTimeout(() => {
      if (loading) setLoading(false)
    }, 2500)

    return () => clearTimeout(timeout)
  }, [imageUrl, loading])

  if (loading) {
    return (
      <div className="p-3">
        <div className="mb-2">
          <Skeleton className="aspect-[2/1] w-full rounded-md" />
        </div>
        <div className="px-2 flex flex-col gap-1">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    )
  }

  return (
    <Link
      aria-label={`Read posts: ${title}`}
      className={cn("group flex flex-col p-3", className)}
      to="/noticias/$slug"
      params={{ slug: slug ?? "" }}
      onMouseEnter={onMouseEnter}
    >
      <div className="">
        {/* biome-ignore lint/performance/noImgElement: No */}
        <img
          alt={title}
          className="aspect-2/1 w-full rounded-md border border-border shadow-xs object-cover transition-opacity duration-300"
          decoding="async"
          loading="lazy"
          src={imageUrl ?? undefined}
          style={{ opacity: imageLoaded ? 1 : 0 }}
        />
      </div>
      <div className="px-2 flex flex-col gap-1">
        <h2
          className={`${main
            ? "font-bold tracking-tight md:text-lg"
            : "font-semibold text-sm leading-5"
            } text-balance mt-2 line-clamp-2`}
        >
          {title}
        </h2>
      </div>
    </Link>
  )
}
