import { useCallback, useId, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { formatBytes, MEDIA_POLICIES, SVG_MIME, type MediaKind, type MediaMime } from "@fsx/api/media-kinds";
import { findSvgProblem } from "@fsx/api/svg-safety";
import { Button } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

import { ImageCropper } from "@/components/image-cropper";
import { showMutationError } from "@/lib/errors";
import { useTRPC } from "@/utils/trpc";

import { HugeiconsIcon } from "@hugeicons/react";
import { Delete03Icon, ImageUploadIcon, Loading01Icon } from "@hugeicons/core-free-icons";

interface ImageUploadProps {
  kind: MediaKind;
  /** Id for the file input, so a surrounding form label targets it. */
  id?: string;
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  // Called with the URL that is being replaced/removed so the owning form can
  // delete it from R2 *after* the record is saved (see usePendingImageDeletes).
  onImageReplaced?: (url: string) => void;
  // Called with every freshly uploaded URL so the owning form can delete it if
  // the save fails or the form is abandoned (see usePendingImageDeletes).
  onUploaded?: (url: string) => void;
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = src;
  });
}

// Logos and flags keep their own aspect ratio and transparency; they are only
// downscaled so a 4000 px export does not end up behind a 20 px icon.
async function fitImage(src: string, maxDimension: number): Promise<Blob> {
  const image = await loadImage(src);
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to create blob"))),
      "image/webp",
      0.9,
    );
  });
}

function isSvg(file: File): boolean {
  return file.type === SVG_MIME || (file.type === "" && file.name.toLowerCase().endsWith(".svg"));
}

function describePolicy(kind: MediaKind): string {
  const policy = MEDIA_POLICIES[kind];
  if (policy.processing === "crop") {
    return `JPEG, PNG, or WebP up to ${formatBytes(policy.maxBytes)}. You crop the image before it uploads.`;
  }
  return `SVG, PNG, WebP, or JPEG up to ${formatBytes(policy.maxBytes)}. Raster images are resized to fit ${policy.maxDimension} px; transparency is kept.`;
}

export function ImageUpload({
  kind,
  id,
  value,
  onChange,
  onImageReplaced,
  onUploaded,
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
  const [status, setStatus] = useState("No image selected.");

  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  const statusId = `${inputId}-status`;

  const policy = MEDIA_POLICIES[kind];
  const uploadMutation = useMutation(trpc.images.upload.mutationOptions());

  const upload = useCallback(
    async (blob: Blob, mime: MediaMime) => {
      if (blob.size > policy.maxBytes) {
        toast.error(`Image is too large (max ${formatBytes(policy.maxBytes)})`);
        setStatus("Upload failed: image too large.");
        return;
      }
      setIsUploading(true);
      setStatus("Uploading image.");
      try {
        const data = await blobToBase64(blob);
        const { url } = await uploadMutation.mutateAsync({ kind, mime, data });

        // Defer the old object's deletion until the record is saved; deleting
        // here would break the current image if the admin cancels the edit.
        if (value && value !== url) {
          onImageReplaced?.(value);
        }

        onUploaded?.(url);
        onChange(url);
        toast.success("Image uploaded");
        setStatus("Image uploaded.");
      } catch (error) {
        showMutationError(error, "Failed to upload image");
        setStatus("Image upload failed.");
      } finally {
        setIsUploading(false);
      }
    },
    [kind, policy.maxBytes, value, uploadMutation, onChange, onImageReplaced, onUploaded],
  );

  const selectSvg = useCallback(
    async (file: File) => {
      if (file.size > policy.maxBytes) {
        toast.error(`SVG is too large (max ${formatBytes(policy.maxBytes)})`);
        setStatus("Upload failed: image too large.");
        return;
      }
      const source = await file.text();
      // The server repeats this check; running it here explains a rejection
      // before the upload.
      const problem = findSvgProblem(source);
      if (problem) {
        toast.error(problem);
        setStatus(`Upload failed: ${problem}.`);
        return;
      }
      await upload(new Blob([source], { type: SVG_MIME }), SVG_MIME);
    },
    [policy.maxBytes, upload],
  );

  const selectFile = useCallback(async (file: File) => {
    if (isSvg(file) && policy.mimes.includes(SVG_MIME)) {
      await selectSvg(file);
      return;
    }
    if (!(policy.mimes as readonly string[]).includes(file.type)) {
      const allowed = policy.mimes.includes(SVG_MIME) ? "an SVG, PNG, WebP, or JPEG" : "a JPEG, PNG, or WebP";
      toast.error(`Select ${allowed} image`);
      setStatus("Upload failed: unsupported file type.");
      return;
    }
    setStatus("Reading image.");
    let dataUrl: string;
    try {
      dataUrl = await fileToDataUrl(file);
    } catch {
      toast.error("Failed to read image file");
      setStatus("Could not read the image.");
      return;
    }
    if (policy.processing === "crop") {
      setImageToCrop(dataUrl);
      setCropperOpen(true);
      setStatus("Image ready to crop.");
      return;
    }
    try {
      const blob = await fitImage(dataUrl, policy.maxDimension ?? 256);
      await upload(blob, blob.type === "image/png" ? "image/png" : "image/webp");
    } catch {
      toast.error("Failed to process image");
      setStatus("Could not process the image.");
    }
  }, [policy, selectSvg, upload]);

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
      // The crop step outputs WebP; fall back to the blob's actual type (some
      // older browsers can't encode WebP) so the stored content type and
      // extension stay accurate.
      const mime = croppedBlob.type === "image/jpeg" || croppedBlob.type === "image/png" || croppedBlob.type === "image/webp"
        ? croppedBlob.type
        : "image/webp";
      await upload(croppedBlob, mime);
    },
    [upload],
  );

  const handleRemove = useCallback(() => {
    if (!value || disabled) return;
    if (value) onImageReplaced?.(value);
    onChange(null);
    setStatus("Image removed.");
    toast.success("Image removed");
  }, [value, disabled, onChange, onImageReplaced]);

  const handleCropperClose = useCallback((open: boolean) => {
    if (!open) {
      setImageToCrop(null);
      setStatus("Crop cancelled.");
    }
    setCropperOpen(open);
  }, []);

  return (
    <div className={className}>
      {value ? (
        <div className="overflow-hidden rounded-lg border">
          {policy.processing === "crop" ? (
            <div className="aspect-video">
              <img
                src={value}
                alt="Uploaded image preview"
                className="h-full w-full object-cover"
                decoding="async"
              />
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center gap-6 bg-muted/40 p-4">
              <img
                src={value}
                alt="Uploaded image preview"
                className="max-h-full max-w-full object-contain outline-none"
                decoding="async"
              />
              {/* How it renders next to a name in ratings and profiles. */}
              <img
                src={value}
                alt=""
                className="size-5 object-contain outline-none"
                decoding="async"
              />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 border-t bg-background p-2">
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
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          aria-describedby={descriptionId}
          className={cn(
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
            policy.processing === "crop" ? "aspect-video" : "h-32",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50",
            (disabled || isUploading) && "pointer-events-none opacity-50",
          )}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
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
              <span className="text-sm text-muted-foreground">Drag an image here or choose a file</span>
            </>
          )}
        </label>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={policy.mimes.includes(SVG_MIME) ? `${policy.mimes.join(",")},.svg` : policy.mimes.join(",")}
        onChange={handleInputChange}
        aria-label="Image to upload"
        aria-describedby={descriptionId}
        disabled={disabled || isUploading}
        className="sr-only"
      />

      <p id={descriptionId} className="mt-1.5 text-xs text-muted-foreground">
        {describePolicy(kind)}
      </p>

      <p id={statusId} className="sr-only" aria-live="polite">
        {status}
      </p>

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
