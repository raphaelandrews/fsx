import { eq } from "drizzle-orm"
import { db } from "@/db"
import { players } from "@/db/schema"

export const getPlayerForEdit = async (id: number) => {
	return db.query.players.findFirst({
		where: eq(players.id, id),
		columns: {
			id: true,
			name: true,
			imageUrl: true,
			cbxId: true,
			fideId: true,
			birth: true,
			sex: true,
			clubId: true,
			locationId: true,
		},
	})
}

export type PlayerForEdit = Awaited<ReturnType<typeof getPlayerForEdit>>
