"use client"

import { useState, useCallback, useRef } from "react"
import { ImageIcon, UploadIcon, XIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ImageCropper } from "@/components/image-cropper"
import { uploadPostImage, deletePostImage } from "@/lib/supabase-storage-posts"
import { createPreviewUrl, revokePreviewUrl } from "@/lib/image-utils"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
	postId: string
	value: string
	onChange: (url: string) => void
	disabled?: boolean
}

export function ImageUpload({
	postId,
	value,
	onChange,
	disabled = false,
}: ImageUploadProps) {
	const [isDragging, setIsDragging] = useState(false)
	const [isUploading, setIsUploading] = useState(false)
	const [cropperOpen, setCropperOpen] = useState(false)
	const [imageToCrop, setImageToCrop] = useState<string | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const handleFileSelect = useCallback((file: File) => {
		if (!file.type.startsWith("image/")) {
			toast.error("Please select an image file")
			return
		}

		const previewUrl = createPreviewUrl(file)
		setImageToCrop(previewUrl)
		setCropperOpen(true)
	}, [])

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			setIsDragging(false)

			if (disabled) return

			const file = e.dataTransfer.files[0]
			if (file) {
				handleFileSelect(file)
			}
		},
		[disabled, handleFileSelect]
	)

	const handleDragOver = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault()
			if (!disabled) {
				setIsDragging(true)
			}
		},
		[disabled]
	)

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		setIsDragging(false)
	}, [])

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (file) {
				handleFileSelect(file)
			}
			// Reset input
			e.target.value = ""
		},
		[handleFileSelect]
	)

	const handleCropComplete = useCallback(
		async (croppedBlob: Blob) => {
			// Clean up the preview URL
			if (imageToCrop) {
				revokePreviewUrl(imageToCrop)
				setImageToCrop(null)
			}

			setIsUploading(true)
			try {
				const url = await uploadPostImage(croppedBlob, postId)
				onChange(url)
				toast.success("Image uploaded successfully")
			} catch (error) {
				console.error("Upload error:", error)
				toast.error("Failed to upload image")
			} finally {
				setIsUploading(false)
			}
		},
		[imageToCrop, postId, onChange]
	)

	const handleRemove = useCallback(async () => {
		if (!value) return

		setIsUploading(true)
		try {
			// Only try to delete from Supabase if it's a Supabase URL
			if (value.includes("supabase.co")) {
				await deletePostImage(postId)
			}
			onChange("")
			toast.success("Image removed")
		} catch (error) {
			console.error("Delete error:", error)
			// Still clear the value even if delete fails
			onChange("")
			toast.error("Failed to delete image from storage, but removed from post")
		} finally {
			setIsUploading(false)
		}
	}, [value, postId, onChange])

	const handleReplace = useCallback(() => {
		inputRef.current?.click()
	}, [])

	const handleCropperClose = useCallback(
		(open: boolean) => {
			if (!open && imageToCrop) {
				revokePreviewUrl(imageToCrop)
				setImageToCrop(null)
			}
			setCropperOpen(open)
		},
		[imageToCrop]
	)

	if (value) {
		return (
			<>
				<div className="relative overflow-hidden rounded-lg border">
					<div className="aspect-video">
						<img
							src={value}
							alt="Cover image"
							className="h-full w-full object-cover"
						/>
					</div>
					<div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
						<Button
							type="button"
							size="sm"
							variant="secondary"
							onClick={handleReplace}
							disabled={disabled || isUploading}
						>
							{isUploading ? (
								<Loader2Icon className="h-4 w-4 animate-spin" />
							) : (
								"Replace"
							)}
						</Button>
						<Button
							type="button"
							size="sm"
							variant="destructive"
							onClick={handleRemove}
							disabled={disabled || isUploading}
						>
							<XIcon className="h-4 w-4" />
						</Button>
					</div>
				</div>

				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					onChange={handleInputChange}
					className="hidden"
				/>

				{imageToCrop && (
					<ImageCropper
						imageSrc={imageToCrop}
						open={cropperOpen}
						onOpenChange={handleCropperClose}
						onCropComplete={handleCropComplete}
						aspectRatio={16 / 9}
						outputWidth={600}
						title="Crop Cover Image"
						description="Adjust the crop area to fit a 16:9 aspect ratio."
					/>
				)}
			</>
		)
	}

	return (
		<>
			<div
				className={cn(
					"flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
					isDragging
						? "border-primary bg-primary/5"
						: "border-muted-foreground/25 hover:border-primary/50",
					disabled && "cursor-not-allowed opacity-50"
				)}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onClick={() => !disabled && inputRef.current?.click()}
			>
				{isUploading ? (
					<Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
				) : (
					<>
						<div className="flex items-center gap-2 text-muted-foreground">
							<ImageIcon className="h-8 w-8" />
							<UploadIcon className="h-6 w-6" />
						</div>
						<p className="text-sm text-muted-foreground">
							Drag & drop or click to upload
						</p>
						<p className="text-xs text-muted-foreground/75">
							16:9 aspect ratio recommended
						</p>
					</>
				)}
			</div>

			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				onChange={handleInputChange}
				className="hidden"
			/>

			{imageToCrop && (
				<ImageCropper
					imageSrc={imageToCrop}
					open={cropperOpen}
					onOpenChange={handleCropperClose}
					onCropComplete={handleCropComplete}
				/>
			)}
		</>
	)
}
