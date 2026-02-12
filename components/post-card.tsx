"use client"

import { useState, useEffect } from "react"
import { ViewTransition } from "react"
import Link from "next/link"

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
}: PostCardProps) {
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
			<div>
				<Skeleton className="aspect-[2/1] w-full" />
				<Skeleton className="mt-2 mb-1 h-5 w-full" />
				<Skeleton className="h-5 w-4/5" />
			</div>
		)
	}

	return (
		<Link
			aria-label={`Read posts: ${title}`}
			className="group p-3"
			href={`/noticias/${slug}`}
			onMouseEnter={onMouseEnter}
		>
			<div className="p-[4px] rounded-[10px] border border-border">
				<ViewTransition name={`image-${slug}`}>
					{/** biome-ignore lint/performance/noImgElement: No */}
					<img
						alt={title}
						className="aspect-[2/1] w-full rounded-md object-cover transition-opacity duration-300"
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
							? "font-bold tracking-tight md:text-xl"
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
