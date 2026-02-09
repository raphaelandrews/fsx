import { generateDefaultOG, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-utils"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Bullet"

export default function Image() {
	return generateDefaultOG({
		title: "Bullet",
		description: "Ranking de xadrez bullet em Sergipe.",
	})
}
