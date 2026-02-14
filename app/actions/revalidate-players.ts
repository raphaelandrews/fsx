"use server"

import { revalidateTag } from "next/cache"

export async function revalidatePlayersAction() {
	revalidateTag("players")
	revalidateTag("swiss-manager-export")
	return { success: true, message: "Players cache revalidated!" }
}

