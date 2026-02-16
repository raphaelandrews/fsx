"use client"

import { useState, useEffect } from "react"
import { ViewTransition } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import type { FreshPost } from "@/db/queries"
import { Skeleton } from "@/components/ui/skeleton"

type PostCardProps = FreshPost & {
	main?: boolean
	onMouseEnter?: () => void
}

export function PostCard({
	title,
	image,
	slug,
	main,
	onMouseEnter,
	className,
}: PostCardProps & { className?: string }) {
	const [loading, setLoading] = useState(true)
	const [imageLoaded, setImageLoaded] = useState(false)

	useEffect(() => {
		const img = new Image()
		img.src = image ?? ""
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
	}, [image, loading])

	if (loading) {
		return (
			<div className="p-3">
				<div className="p-[4px] rounded-[10px] border border-border mb-2">
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
			href={`/noticias/${slug}`}
			onMouseEnter={onMouseEnter}
		>
			<div className="p-[4px] rounded-[10px] border border-border">
				<ViewTransition name={`image-${slug}`}>
					{/** biome-ignore lint/performance/noImgElement: No */}
					<img
						alt={title}
						className="aspect-[2/1] w-full rounded-md border border-border object-cover transition-opacity duration-300"
						decoding="async"
						loading="lazy"
						src={image}
						style={{ opacity: imageLoaded ? 1 : 0 }}
					/>
				</ViewTransition>
			</div>
			<div className="px-2 flex flex-col gap-1">
				<ViewTransition name={`title-${slug}`}>
					<h2
						className={`${main
							? "font-bold tracking-tight md:text-lg"
							: "font-semibold text-sm leading-5"
							} text-balance mt-2 line-clamp-2`}
					>
						{title}
					</h2>
				</ViewTransition>
			</div>
		</Link>
	)
}
