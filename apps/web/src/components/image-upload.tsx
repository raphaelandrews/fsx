import { useCallback, useId, useRef, useState } from "react";
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

export function ImageUpload({
  kind,
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
  const [status, setStatus] = useState("Nenhuma imagem selecionada.");

  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const descriptionId = `${inputId}-description`;
  const statusId = `${inputId}-status`;

  const uploadMutation = useMutation(trpc.images.upload.mutationOptions());

  const selectFile = useCallback(async (file: File) => {
    if (!(["image/jpeg", "image/png", "image/webp"] as string[]).includes(file.type)) {
      toast.error("Select a JPEG, PNG, or WebP image");
      setStatus("Falha ao enviar: tipo de arquivo não suportado.");
      return;
    }
    setStatus("Lendo imagem.");
    try {
      const dataUrl = await fileToDataUrl(file);
      setImageToCrop(dataUrl);
      setCropperOpen(true);
      setStatus("Imagem pronta para recorte.");
    } catch {
      toast.error("Failed to read image file");
      setStatus("Falha ao ler a imagem.");
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
      setStatus("Enviando imagem.");
      try {
        const data = await blobToBase64(croppedBlob);
        const mime = croppedBlob.type === "image/jpeg" || croppedBlob.type === "image/png" || croppedBlob.type === "image/webp"
          ? croppedBlob.type
          : "image/webp";
        const { url } = await uploadMutation.mutateAsync({
          kind,
          // The crop step outputs WebP; fall back to the blob's actual type
          // (some older browsers can't encode WebP) so the stored
          // content-type + extension stay accurate.
          mime,
          data,
        });

        // Defer the old object's deletion until the record is saved; deleting
        // here would break the current image if the admin cancels the edit.
        if (value && value !== url) {
          onImageReplaced?.(value);
        }

        onUploaded?.(url);
        onChange(url);
        toast.success("Image uploaded");
        setStatus("Imagem enviada com sucesso.");
      } catch {
        toast.error("Failed to upload image");
        setStatus("Falha ao enviar a imagem.");
      } finally {
        setIsUploading(false);
      }
    },
    [value, kind, uploadMutation, onChange, onImageReplaced, onUploaded],
  );

  const handleRemove = useCallback(() => {
    if (!value || disabled) return;
    if (value) onImageReplaced?.(value);
    onChange(null);
    setStatus("Imagem removida.");
    toast.success("Image removed");
  }, [value, disabled, onChange, onImageReplaced]);

  const handleCropperClose = useCallback((open: boolean) => {
    if (!open) {
      setImageToCrop(null);
      setStatus("Recorte cancelado.");
    }
    setCropperOpen(open);
  }, []);

  return (
    <div className={className}>
      {value ? (
        <div className="overflow-hidden rounded-lg border">
          <div className="aspect-video">
            <img
              src={value}
              alt="Pré-visualização da imagem enviada"
              className="h-full w-full object-cover"
              decoding="async"
            />
          </div>
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
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          aria-describedby={descriptionId}
          className={cn(
            "flex aspect-video flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring",
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
              <span className="text-sm text-muted-foreground">Arraste uma imagem ou selecione um arquivo</span>
            </>
          )}
        </label>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        aria-label="Imagem para envio"
        aria-describedby={descriptionId}
        disabled={disabled || isUploading}
        className="sr-only"
      />

      <p id={descriptionId} className="mt-1.5 text-xs text-muted-foreground">
        JPEG, PNG ou WebP. A imagem será recortada antes do envio.
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
