"use client"

import { useState, useCallback, useRef } from "react"
import { UserIcon, UploadIcon, XIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ImageCropper } from "@/components/image-cropper"
import { uploadPlayerImage, deletePlayerImage } from "@/lib/supabase-storage-players"
import { createPreviewUrl, revokePreviewUrl } from "@/lib/image-utils"
import { cn } from "@/lib/utils"

interface AvatarUploadProps {
	playerId: number
	value: string | null
	onChange: (url: string | null) => void
	disabled?: boolean
}

export function AvatarUpload({
	playerId,
	value,
	onChange,
	disabled = false,
}: AvatarUploadProps) {
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

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0]
			if (file) {
				handleFileSelect(file)
			}
			e.target.value = ""
		},
		[handleFileSelect]
	)

	const handleCropComplete = useCallback(
		async (croppedBlob: Blob) => {
			if (imageToCrop) {
				revokePreviewUrl(imageToCrop)
				setImageToCrop(null)
			}

			setIsUploading(true)
			try {
				const url = await uploadPlayerImage(croppedBlob, playerId)
				onChange(url)
				toast.success("Avatar uploaded successfully")
			} catch (error) {
				console.error("Upload error:", error)
				toast.error("Failed to upload avatar")
			} finally {
				setIsUploading(false)
			}
		},
		[imageToCrop, playerId, onChange]
	)

	const handleRemove = useCallback(async () => {
		if (!value) return

		setIsUploading(true)
		try {
			if (value.includes("supabase.co")) {
				await deletePlayerImage(playerId)
			}
			onChange(null)
			toast.success("Avatar removed")
		} catch (error) {
			console.error("Delete error:", error)
			onChange(null)
			toast.error("Failed to delete from storage, but removed from player")
		} finally {
			setIsUploading(false)
		}
	}, [value, playerId, onChange])

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

	return (
		<>
			<div className="flex items-center gap-4">
				<div
					className={cn(
						"relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2",
						value ? "border-transparent" : "border-dashed border-muted-foreground/25"
					)}
				>
					{value ? (
						<img
							src={value}
							alt="Avatar"
							className="h-full w-full object-cover"
						/>
					) : (
						<UserIcon className="h-8 w-8 text-muted-foreground" />
					)}

					{isUploading && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/50">
							<Loader2Icon className="h-6 w-6 animate-spin text-white" />
						</div>
					)}
				</div>

				<div className="flex flex-col gap-2">
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={() => inputRef.current?.click()}
						disabled={disabled || isUploading}
					>
						<UploadIcon className="mr-2 h-4 w-4" />
						{value ? "Replace" : "Upload"}
					</Button>

					{value && (
						<Button
							type="button"
							size="sm"
							variant="ghost"
							onClick={handleRemove}
							disabled={disabled || isUploading}
							className="text-destructive hover:text-destructive"
						>
							<XIcon className="mr-2 h-4 w-4" />
							Remove
						</Button>
					)}
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
					aspectRatio={1}
					outputWidth={80}
					title="Crop Avatar"
					description="Adjust the crop area for a square avatar (1:1)."
				/>
			)}
		</>
	)
}
