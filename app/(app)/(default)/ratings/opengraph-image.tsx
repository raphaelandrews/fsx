import { generateDefaultOG, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-utils"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Ratings"

export default function Image() {
	return generateDefaultOG({
		title: "Ratings",
		description: "Rankings e ratings dos jogadores de xadrez de Sergipe.",
	})
}
