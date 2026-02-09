import { getPlayerById } from "@/db/queries"
import { generatePlayerOG, generateDefaultOG, OG_SIZE, OG_CONTENT_TYPE } from "@/lib/og-utils"

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = "Jogador"

export default async function Image({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params
	const player = await getPlayerById(Number(id))

	if (!player) {
		return generateDefaultOG({
			title: "Jogador não encontrado",
			description: "Perfil do jogador na Federação Sergipana de Xadrez.",
		})
	}

	return generatePlayerOG({
		name: player.name,
		id: id,
	})
}
