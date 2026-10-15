import { createClient } from "@/utils/supabase/client"

const BUCKET_NAME = "player-images"

/**
 * Upload a player image to Supabase Storage
 * Automatically replaces existing image via upsert
 * Returns the public URL of the uploaded image
 */
export async function uploadPlayerImage(
	file: Blob,
	playerId: number
): Promise<string> {
	const supabase = createClient()

	const fileName = `${playerId}/player-${playerId}.webp`

	const { data, error } = await supabase.storage
		.from(BUCKET_NAME)
		.upload(fileName, file, {
			contentType: "image/webp",
			upsert: true,
		})

	if (error) {
		throw new Error(`Failed to upload image: ${error.message}`)
	}

	const {
		data: { publicUrl },
	} = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path)

	// Add timestamp to bust CDN cache
	return `${publicUrl}?t=${Date.now()}`
}

/**
 * Delete a player's avatar from Supabase Storage
 */
export async function deletePlayerImage(playerId: number): Promise<void> {
	const supabase = createClient()

	const filePath = `${playerId}/player-${playerId}.webp`

	const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath])

	if (error) {
		throw new Error(`Failed to delete image: ${error.message}`)
	}
}
