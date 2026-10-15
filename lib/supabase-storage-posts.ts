import { createClient } from "@/utils/supabase/client"

const BUCKET_NAME = "post-images"

/**
 * Upload an image to Supabase Storage
 * Automatically replaces existing image via upsert
 * Returns the public URL of the uploaded image
 */
export async function uploadPostImage(
	file: Blob,
	postId: string
): Promise<string> {
	const supabase = createClient()

	// Fixed filename - one image per post
	const fileName = `${postId}/post-${postId}.webp`

	const { data, error } = await supabase.storage
		.from(BUCKET_NAME)
		.upload(fileName, file, {
			contentType: "image/webp",
			upsert: true, // Replace existing image
		})

	if (error) {
		throw new Error(`Failed to upload image: ${error.message}`)
	}

	// Get public URL with cache buster to ensure fresh image
	const {
		data: { publicUrl },
	} = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path)

	// Add timestamp to bust CDN cache
	return `${publicUrl}?t=${Date.now()}`
}

/**
 * Delete the cover image for a post from Supabase Storage
 */
export async function deletePostImage(postId: string): Promise<void> {
	const supabase = createClient()

	const filePath = `${postId}/post-${postId}.webp`

	const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath])

	if (error) {
		throw new Error(`Failed to delete image: ${error.message}`)
	}
}

/**
 * Check if a post has an image in storage
 */
export async function hasPostImage(postId: string): Promise<boolean> {
	const supabase = createClient()

	const { data, error } = await supabase.storage
		.from(BUCKET_NAME)
		.list(postId)

	if (error) {
		return false
	}

	return data.some((file) => file.name === `post-${postId}.webp`)
}
