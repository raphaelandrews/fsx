import { generateMainOG, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-utils"
import { siteConfig } from "@/lib/site"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = siteConfig.name

export default function Image() {
	return generateMainOG()
}
