
import { useState, useRef, useCallback } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@fsx/ui/components/dialog"
import { Button } from "@fsx/ui/components/button"

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface ImageCropperProps {
  imageSrc: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onCropComplete: (croppedBlob: Blob) => void
  aspectRatio?: number
  outputWidth?: number
  title?: string
  description?: string
}

async function cropImage(
  imageSrc: string,
  crop: CropArea,
  outputWidth: number
): Promise<Blob> {
  const canvas = document.createElement("canvas")
  const image = new Image()
  image.crossOrigin = "anonymous"

  return new Promise((resolve, reject) => {
    image.onload = () => {
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height

      const cropWidth = crop.width * scaleX
      const cropHeight = crop.height * scaleY

      canvas.width = outputWidth
      canvas.height = (outputWidth / crop.width) * crop.height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Could not get canvas context"))
        return
      }

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        cropWidth,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height
      )

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Failed to create blob"))
        },
        "image/png"
      )
    }
    image.onerror = () => reject(new Error("Failed to load image"))
    image.src = imageSrc
  })
}

export function ImageCropper({
  imageSrc,
  open,
  onOpenChange,
  onCropComplete,
  aspectRatio = 16 / 9,
  outputWidth = 700,
  title = "Crop Image",
  description = "Adjust the crop area.",
}: ImageCropperProps) {
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 100, height: 100 })
  const [isProcessing, setIsProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement & HTMLDivElement>(null)

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget
      const cropWidth = Math.min(width * 0.9, width)
      const cropHeight = cropWidth / aspectRatio
      const x = (width - cropWidth) / 2
      const y = (height - cropHeight) / 2
      setCrop({ x, y, width: cropWidth, height: cropHeight })
    },
    [aspectRatio]
  )

  const handleApply = async () => {
    if (!imgRef.current) return

    setIsProcessing(true)
    try {
      const croppedBlob = await cropImage(imageSrc, crop, outputWidth)
      onCropComplete(croppedBlob)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to crop image:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div
          ref={imgRef}
          className="relative flex items-center justify-center overflow-hidden rounded-lg bg-muted"
          style={{ aspectRatio }}
        >
          <img
            src={imageSrc}
            alt="Crop preview"
            onLoad={onImageLoad}
            className="max-h-[60vh] object-contain"
            style={{
              transform: `translate(-${crop.x * 0.5}px, -${crop.y * 0.5}px) scale(${Math.min(
                (outputWidth || 700) / crop.width,
                1
              )})`
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={isProcessing}>
            {isProcessing ? "Processing..." : "Apply Crop"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
