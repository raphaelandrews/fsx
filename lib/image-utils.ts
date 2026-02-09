export interface CropArea {
	x: number
	y: number
	width: number
	height: number
}

/**
 * Convert an image file to WebP format
 */
export async function convertToWebP(
	file: File,
	quality: number = 0.85
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		const url = URL.createObjectURL(file)

		img.onload = () => {
			URL.revokeObjectURL(url)

			const canvas = document.createElement("canvas")
			canvas.width = img.width
			canvas.height = img.height

			const ctx = canvas.getContext("2d")
			if (!ctx) {
				reject(new Error("Failed to get canvas context"))
				return
			}

			ctx.drawImage(img, 0, 0)

			canvas.toBlob(
				(blob) => {
					if (blob) {
						resolve(blob)
					} else {
						reject(new Error("Failed to convert image to WebP"))
					}
				},
				"image/webp",
				quality
			)
		}

		img.onerror = () => {
			URL.revokeObjectURL(url)
			reject(new Error("Failed to load image"))
		}

		img.src = url
	})
}

/**
 * Crop an image to the specified area and return as WebP blob
 * Output: 600x338 (16:9) by default to save storage
 */
export async function cropImage(
	imageSrc: string,
	crop: CropArea,
	outputWidth: number = 600
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const img = new Image()

		img.onload = () => {
			const canvas = document.createElement("canvas")

			// Calculate output dimensions maintaining 16:9 aspect ratio
			const aspectRatio = 16 / 9
			const outputHeight = Math.round(outputWidth / aspectRatio)

			canvas.width = outputWidth
			canvas.height = outputHeight

			const ctx = canvas.getContext("2d")
			if (!ctx) {
				reject(new Error("Failed to get canvas context"))
				return
			}

			// Draw the cropped portion of the image
			ctx.drawImage(
				img,
				crop.x,
				crop.y,
				crop.width,
				crop.height,
				0,
				0,
				outputWidth,
				outputHeight
			)

			canvas.toBlob(
				(blob) => {
					if (blob) {
						resolve(blob)
					} else {
						reject(new Error("Failed to crop image"))
					}
				},
				"image/webp",
				0.85
			)
		}

		img.onerror = () => {
			reject(new Error("Failed to load image for cropping"))
		}

		img.crossOrigin = "anonymous"
		img.src = imageSrc
	})
}

/**
 * Create a preview URL from a blob
 */
export function createPreviewUrl(blob: Blob): string {
	return URL.createObjectURL(blob)
}

/**
 * Revoke a preview URL to free memory
 */
export function revokePreviewUrl(url: string): void {
	URL.revokeObjectURL(url)
}
