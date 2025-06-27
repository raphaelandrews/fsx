import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	experimental: {
		inlineCss: true,
		ppr: true,
		useCache: true,
		viewTransition: true,
	},
	images: {
		domains: ["files.edgestore.dev"],
	},
}

export default nextConfig
