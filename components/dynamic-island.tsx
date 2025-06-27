"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Music } from "lucide-react"
import { cn } from "@/lib/utils"

interface IslandContent {
	id: string
	type: "compact" | "expanded" | "large"
	component: React.ReactNode
	duration?: number
}

const sampleContents: IslandContent[] = [
	{
		id: "music",
		type: "expanded",
		component: (
			<div className="flex items-center gap-3 px-4 py-2">
				<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
					<Music className="h-4 w-4 text-white" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="truncate font-medium text-sm text-white">Now Playing</p>
					<p className="truncate text-white/70 text-xs">Midnight City - M83</p>
				</div>
				<div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
			</div>
		),
	},
]

export function DynamicIsland() {
	const [currentContent, setCurrentContent] = useState<IslandContent | null>(
		null
	)
	const [isVisible, setIsVisible] = useState(false)
	const [contentIndex, setContentIndex] = useState(0)

	useEffect(() => {
		const showContent = () => {
			const content = sampleContents[contentIndex]
			setCurrentContent(content)
			setIsVisible(true)

			setTimeout(() => {
				setIsVisible(false)
				setTimeout(() => {
					setCurrentContent(null)
					setContentIndex((prev) => (prev + 1) % sampleContents.length)
				}, 300)
			}, content.duration || 3000)
		}

		const interval = setInterval(showContent, 6000)
		showContent() // Show first content immediately

		return () => clearInterval(interval)
	}, [contentIndex])

	const getIslandSize = () => {
		if (!currentContent) return "w-32 h-8"

		switch (currentContent.type) {
			case "compact":
				return "w-40 h-10"
			case "expanded":
				return "w-80 h-14"
			case "large":
				return "w-96 h-32"
			default:
				return "w-32 h-8"
		}
	}

	return (
		<div className="-translate-x-1/2 fixed top-6 left-1/2 z-50 transform">
			<div
				className={cn(
					"overflow-hidden rounded-full bg-black transition-all duration-500 ease-out",
					getIslandSize(),
					isVisible ? "scale-100 opacity-100" : "scale-95 opacity-70"
				)}
			>
				{currentContent ? (
					<div className="flex h-full w-full items-center justify-center">
						{currentContent.component}
					</div>
				) : (
					<div className="h-full w-full rounded-full bg-black" />
				)}
			</div>
		</div>
	)
}
