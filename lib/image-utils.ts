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

interface CropOptions {
	outputWidth?: number
	aspectRatio?: number
	quality?: number
}

/**
 * Crop an image to the specified area and return as WebP blob
 * Default: 600px wide, 16:9 aspect ratio
 */
export async function cropImage(
	imageSrc: string,
	crop: CropArea,
	options: CropOptions = {}
): Promise<Blob> {
	const {
		outputWidth = 600,
		aspectRatio = 16 / 9,
		quality = 0.85,
	} = options

	return new Promise((resolve, reject) => {
		const img = new Image()

		img.onload = () => {
			const canvas = document.createElement("canvas")

			const outputHeight = Math.round(outputWidth / aspectRatio)

			canvas.width = outputWidth
			canvas.height = outputHeight

			const ctx = canvas.getContext("2d")
			if (!ctx) {
				reject(new Error("Failed to get canvas context"))
				return
			}

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
				quality
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
