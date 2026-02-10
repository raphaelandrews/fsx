import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	cacheComponents: true,
	experimental: {
		inlineCss: true,
		useCache: true,
		viewTransition: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "files.edgestore.dev",
			},
			{
				protocol: "https",
				hostname: "xfsdbjqtliawxkyddoee.supabase.co",
			},
		],
	},
}

export default nextConfig
