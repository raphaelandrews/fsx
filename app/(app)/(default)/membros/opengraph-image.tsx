import { generateDefaultOG, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-utils"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Membros"

export default function Image() {
	return generateDefaultOG({
		title: "Membros",
		description: "Membros da diretoria da Federação Sergipana de Xadrez.",
	})
}
