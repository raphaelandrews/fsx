import { generateDefaultOG, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-utils"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Sobre"

export default function Image() {
	return generateDefaultOG({
		title: "Sobre",
		description: "Documentos e história da Federação Sergipana de Xadrez.",
	})
}
