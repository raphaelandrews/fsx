import type { Metadata } from "next"

import {
	getEvents,
	getFreshAnnouncements,
	getFreshPosts,
	getTopPlayers,
} from "@/db/queries"
import { siteConfig } from "@/lib/site"

import { Announcements } from "@/components/home/announcements"
import { Events } from "@/components/home/events"
import { FAQ } from "@/components/home/faq"
import { Posts } from "@/components/home/posts"
import { TopPlayers } from "@/components/home/ratings/top-players"
import { Hero } from "@/components/home/hero"

export const metadata: Metadata = {
	openGraph: {
		images: [
			{
				url: `${siteConfig.url}/og/og.jpg`,
				width: 1920,
				height: 1080,
			},
		],
	},
}

export default async function Page() {
	const [events, posts, announcements, topPlayers] = await Promise.all([
		getEvents(),
		getFreshPosts(),
		getFreshAnnouncements(),
		getTopPlayers(),
	])

	return (
		<>
			<Hero posts={posts} />
			{events.length > 0 && <Events events={events} />}
			<Posts posts={posts} />
			<TopPlayers topPlayers={topPlayers} />
			<Announcements announcements={announcements} />
			<FAQ />
		</>
	)
}
