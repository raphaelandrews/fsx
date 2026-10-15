"use server"

import * as XLSX from "xlsx"

import { getPlayersForSwissManager } from "@/db/queries"

type RatingType = "classic" | "rapid" | "blitz"

interface SwissManagerRow {
	ID_No: number
	Name: string
	Sex: string
	Fed: string
	ClubNo: number | string
	ClubName: string
	Birthday: string
	Fide_No: number
	Rtg_Int: number
}

function formatDate(date: Date | null): string {
	if (!date) return ""
	const d = new Date(date)
	const year = d.getFullYear()
	const month = String(d.getMonth() + 1).padStart(2, "0")
	const day = String(d.getDate()).padStart(2, "0")
	return `${year}-${month}-${day}`
}

export async function generateSwissManagerExcel(ratingType: RatingType) {
	try {
		const players = await getPlayersForSwissManager()

		const data: SwissManagerRow[] = players.map((player) => ({
			ID_No: player.id,
			Name: player.name,
			Sex: player.sex ? "f" : "",
			Fed: "BRA",
			ClubNo: player.club?.id ?? "",
			ClubName: player.club?.name ?? "",
			Birthday: formatDate(player.birth),
			Fide_No: player.id,
			Rtg_Int: player[ratingType] ?? 0,
		}))

		const workbook = XLSX.utils.book_new()
		const worksheet = XLSX.utils.json_to_sheet(data)

		worksheet["!cols"] = [
			{ wch: 8 },
			{ wch: 35 },
			{ wch: 5 },
			{ wch: 5 },
			{ wch: 8 },
			{ wch: 30 },
			{ wch: 12 },
			{ wch: 10 },
			{ wch: 8 },
		]

		XLSX.utils.book_append_sheet(workbook, worksheet, "Players")

		const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
		const base64 = Buffer.from(buffer).toString("base64")

		return { success: true, data: base64 }
	} catch (error) {
		console.error("Error generating Swiss Manager Excel:", error)
		return { success: false, error: "Failed to generate Excel file" }
	}
}
