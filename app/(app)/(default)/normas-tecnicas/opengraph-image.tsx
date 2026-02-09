import { generateDefaultOG, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-utils"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Normas Técnicas"

export default function Image() {
	return generateDefaultOG({
		title: "Normas Técnicas",
		description: "Normas técnicas e regulamentos da Federação Sergipana de Xadrez.",
	})
}
