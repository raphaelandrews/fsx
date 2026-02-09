"use client"

import { useState, useRef, useCallback } from "react"
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cropImage, type CropArea } from "@/lib/image-utils"

interface ImageCropperProps {
	imageSrc: string
	open: boolean
	onOpenChange: (open: boolean) => void
	onCropComplete: (croppedBlob: Blob) => void
}

function centerAspectCrop(
	mediaWidth: number,
	mediaHeight: number,
	aspect: number
): Crop {
	return centerCrop(
		makeAspectCrop(
			{
				unit: "%",
				width: 90,
			},
			aspect,
			mediaWidth,
			mediaHeight
		),
		mediaWidth,
		mediaHeight
	)
}

export function ImageCropper({
	imageSrc,
	open,
	onOpenChange,
	onCropComplete,
}: ImageCropperProps) {
	const [crop, setCrop] = useState<Crop>()
	const [completedCrop, setCompletedCrop] = useState<CropArea | null>(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const imgRef = useRef<HTMLImageElement>(null)

	const onImageLoad = useCallback(
		(e: React.SyntheticEvent<HTMLImageElement>) => {
			const { width, height } = e.currentTarget
			setCrop(centerAspectCrop(width, height, 16 / 9))
		},
		[]
	)

	const handleCropChange = useCallback((newCrop: Crop) => {
		setCrop(newCrop)
	}, [])

	const handleCropComplete = useCallback(
		(crop: Crop) => {
			if (!imgRef.current) return

			const image = imgRef.current
			const scaleX = image.naturalWidth / image.width
			const scaleY = image.naturalHeight / image.height

			setCompletedCrop({
				x: (crop.x ?? 0) * scaleX,
				y: (crop.y ?? 0) * scaleY,
				width: (crop.width ?? 0) * scaleX,
				height: (crop.height ?? 0) * scaleY,
			})
		},
		[]
	)

	const handleApply = async () => {
		if (!completedCrop || !imgRef.current) return

		setIsProcessing(true)
		try {
			const croppedBlob = await cropImage(imageSrc, completedCrop)
			onCropComplete(croppedBlob)
			onOpenChange(false)
		} catch (error) {
			console.error("Failed to crop image:", error)
		} finally {
			setIsProcessing(false)
		}
	}

	const handleCancel = () => {
		setCrop(undefined)
		setCompletedCrop(null)
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl">
				<DialogHeader>
					<DialogTitle>Crop Image</DialogTitle>
					<DialogDescription>
						Adjust the crop area to fit a 16:9 aspect ratio for the cover image.
					</DialogDescription>
				</DialogHeader>

				<div className="flex items-center justify-center overflow-hidden rounded-lg bg-muted">
					<ReactCrop
						crop={crop}
						onChange={handleCropChange}
						onComplete={handleCropComplete}
						aspect={16 / 9}
						className="max-h-[60vh]"
					>
						<img
							ref={imgRef}
							src={imageSrc}
							alt="Crop preview"
							onLoad={onImageLoad}
							className="max-h-[60vh] object-contain"
						/>
					</ReactCrop>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
						Cancel
					</Button>
					<Button onClick={handleApply} disabled={isProcessing || !completedCrop}>
						{isProcessing ? "Processing..." : "Apply Crop"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
