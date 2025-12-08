"use server"

import { revalidateTag } from "next/cache"

export async function revalidatePlayersAction() {
	revalidateTag("players", "max")
	return { success: true, message: "Players cache revalidated!" }
}

