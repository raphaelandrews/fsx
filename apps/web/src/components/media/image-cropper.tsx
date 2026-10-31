import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import { Button } from "@fsx/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@fsx/ui/components/dialog";

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function cropImage(
  imageSrc: string,
  crop: CropArea,
  options: { outputWidth: number; aspectRatio: number },
): Promise<Blob> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = options.outputWidth;
  canvas.height = Math.round(options.outputWidth / options.aspectRatio);

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob"));
      },
      "image/webp",
      0.85,
    );
  });
}

interface ImageCropperProps {
  imageSrc: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio?: number;
  outputWidth?: number;
  title?: string;
  description?: string;
  /** Button and error texts; English by default, for the public form in Portuguese. */
  labels?: { cancel: string; apply: string; processing: string; previewFailed: string; previewFailedHint: string };
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

export function ImageCropper({
  imageSrc,
  open,
  onOpenChange,
  onCropComplete,
  aspectRatio = 1,
  outputWidth = 400,
  title = "Crop Image",
  description = "Adjust the crop area.",
  labels = {
    cancel: "Cancel",
    apply: "Apply Crop",
    processing: "Processing...",
    previewFailed: "Could not preview this image",
    previewFailedHint: "The file may be in a format your browser cannot display (e.g. HEIC). Try another image.",
  },
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<CropArea | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [didImageFail, setDidImageFail] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setDidImageFail(false);
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    },
    [aspectRatio],
  );

  const handleCropChange = useCallback((newCrop: Crop) => {
    setCrop(newCrop);
  }, []);

  const handleCropComplete = useCallback((c: Crop) => {
    if (!imgRef.current) return;
    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    setCompletedCrop({
      x: (c.x ?? 0) * scaleX,
      y: (c.y ?? 0) * scaleY,
      width: (c.width ?? 0) * scaleX,
      height: (c.height ?? 0) * scaleY,
    });
  }, []);

  const handleApply = async () => {
    if (!completedCrop || !imgRef.current) return;
    setIsProcessing(true);
    try {
      const croppedBlob = await cropImage(imageSrc, completedCrop, { outputWidth, aspectRatio });
      onCropComplete(croppedBlob);
      onOpenChange(false);
    } catch {
      console.error("Failed to crop image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    setCrop(undefined);
    setCompletedCrop(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center overflow-hidden rounded-lg bg-muted">
          {didImageFail ? (
            <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-2 p-6 text-center">
              <p className="text-sm font-medium text-destructive">{labels.previewFailed}</p>
              <p className="text-sm text-muted-foreground">{labels.previewFailedHint}</p>
            </div>
          ) : (
            <ReactCrop
              crop={crop}
              onChange={handleCropChange}
              onComplete={handleCropComplete}
              aspect={aspectRatio}
              className="max-h-[60vh]"
            >
              <img
                ref={imgRef}
                key={imageSrc}
                src={imageSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                onError={() => setDidImageFail(true)}
                className="max-h-[60vh] object-contain"
              />
            </ReactCrop>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={handleCancel} disabled={isProcessing}>
            {labels.cancel}
          </Button>
          <Button onClick={handleApply} disabled={isProcessing || !completedCrop || didImageFail}>
            {isProcessing ? labels.processing : labels.apply}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
