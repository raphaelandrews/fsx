import { useCallback, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

import { ImageCropper } from "@/components/image-cropper";
import { useTRPC } from "@/utils/trpc";

import { HugeiconsIcon } from "@hugeicons/react";
import { Delete03Icon, ImageUploadIcon, Loading01Icon } from "@hugeicons/core-free-icons";

interface ImageUploadProps {
  kind: "players" | "posts";
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  aspectRatio?: number;
  outputWidth?: number;
  title?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
}

// Use a data: URL for the crop preview instead of a blob: URL. Blob URLs can
// fail to render in <img> in some contexts (strict COOP/CORP, extensions,
// cross-origin embeds) and must be manually revoked; data: URLs render
// everywhere and need no lifecycle management.
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({
  kind,
  value,
  onChange,
  aspectRatio = 1,
  outputWidth = 400,
  title = "Crop Image",
  description = "Adjust the crop area.",
  disabled = false,
  className,
}: ImageUploadProps) {
  const trpc = useTRPC();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation(trpc.images.upload.mutationOptions());
  const deleteMutation = useMutation(trpc.images.delete.mutationOptions());

  const selectFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setImageToCrop(dataUrl);
      setCropperOpen(true);
    } catch {
      toast.error("Failed to read image file");
    }
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) selectFile(file);
      e.target.value = "";
    },
    [selectFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) selectFile(file);
    },
    [disabled, selectFile],
  );

  const handleCropComplete = useCallback(
    async (croppedBlob: Blob) => {
      setImageToCrop(null);
      setIsUploading(true);
      try {
        const data = await blobToBase64(croppedBlob);
        const { url } = await uploadMutation.mutateAsync({
          kind,
          // The crop step outputs WebP; fall back to the blob's actual type
          // (some older browsers can't encode WebP) so the stored
          // content-type + extension stay accurate.
          mime: croppedBlob.type || "image/webp",
          data,
        });

        // Replace the previous object so we don't leak orphaned images.
        if (value && value !== url) {
          await deleteMutation.mutateAsync({ url: value }).catch(() => {});
        }

        onChange(url);
        toast.success("Image uploaded");
      } catch {
        toast.error("Failed to upload image");
      } finally {
        setIsUploading(false);
      }
    },
    [value, kind, uploadMutation, deleteMutation, onChange],
  );

  const handleRemove = useCallback(async () => {
    if (!value || disabled) return;
    setIsUploading(true);
    try {
      await deleteMutation.mutateAsync({ url: value });
      onChange(null);
      toast.success("Image removed");
    } catch {
      // Still clear the value even if the object delete failed.
      onChange(null);
      toast.error("Removed from record, but could not delete the object");
    } finally {
      setIsUploading(false);
    }
  }, [value, disabled, deleteMutation, onChange]);

  const handleCropperClose = useCallback((open: boolean) => {
    if (!open) {
      setImageToCrop(null);
    }
    setCropperOpen(open);
  }, []);

  return (
    <div className={className}>
      {value ? (
        <div className="relative overflow-hidden rounded-lg border">
          <div className="aspect-video">
            <img src={value} alt="Uploaded image preview" className="h-full w-full object-cover" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity hover:opacity-100">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={disabled || isUploading}
              onClick={() => inputRef.current?.click()}
            >
              {isUploading ? (
                <HugeiconsIcon
                  className="size-4 animate-spin"
                  icon={Loading01Icon}
                  strokeWidth={2}
                />
              ) : (
                "Replace"
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={disabled || isUploading}
              onClick={handleRemove}
            >
              <HugeiconsIcon className="size-4" icon={Delete03Icon} strokeWidth={2} />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
            disabled && "cursor-not-allowed opacity-50",
          )}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          {isUploading ? (
            <HugeiconsIcon
              className="size-8 animate-spin text-muted-foreground"
              icon={Loading01Icon}
              strokeWidth={2}
            />
          ) : (
            <>
              <HugeiconsIcon
                className="size-8 text-muted-foreground"
                icon={ImageUploadIcon}
                strokeWidth={2}
              />
              <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
            </>
          )}
        </div>
      )}

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
          aspectRatio={aspectRatio}
          outputWidth={outputWidth}
          title={title}
          description={description}
        />
      )}
    </div>
  );
}
