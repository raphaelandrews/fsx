import { RASTER_MIMES, type MediaMime } from "@fsx/api/media-kinds";

// Only a sanity limit on what is read into the browser: the crop that follows outputs a small image.
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

export const PHOTO_ACCEPT = RASTER_MIMES.join(",");
export const PHOTO_OUTPUT_WIDTH = 400;

export interface PreparedPhoto {
  mime: Extract<MediaMime, "image/jpeg" | "image/png" | "image/webp">;
  data: string;
  previewUrl: string;
}

/** Reads a chosen file for cropping. Throws an Error with a message for the visitor. */
export function readPhotoFile(file: File): Promise<string> {
  if (!(RASTER_MIMES as readonly string[]).includes(file.type)) {
    return Promise.reject(new Error("Use uma foto JPEG, PNG ou WebP."));
  }
  if (file.size > MAX_SOURCE_BYTES) return Promise.reject(new Error("A foto é grande demais. Escolha uma de até 20 MB."));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Não foi possível ler esta foto. Tente outra."));
    reader.readAsDataURL(file);
  });
}

const toBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]!);
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(blob);
  });

/**
 * The cropped blob is already small (a square of PHOTO_OUTPUT_WIDTH px, tens of KB) and a canvas export
 * carries no EXIF block, so camera model and GPS position never leave the device.
 */
export async function blobToPhoto(blob: Blob): Promise<PreparedPhoto> {
  const mime = blob.type === "image/jpeg" || blob.type === "image/png" ? blob.type : "image/webp";
  return { mime, data: await toBase64(blob), previewUrl: URL.createObjectURL(blob) };
}
