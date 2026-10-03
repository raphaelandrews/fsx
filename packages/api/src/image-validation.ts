import { TRPCError } from "@trpc/server";

import { MAX_MEDIA_BYTES, type MediaMime } from "./media-kinds";

export const MAX_BASE64_LENGTH = Math.ceil((MAX_MEDIA_BYTES * 4) / 3) + 4;

export function base64ToBytes(b64: string): Uint8Array {
  if (b64.length > MAX_BASE64_LENGTH || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(b64)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image data" });
  }
  try {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch (error) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image data", cause: error });
  }
}

export function hasImageSignature(bytes: Uint8Array, mime: Exclude<MediaMime, "image/svg+xml">): boolean {
  if (mime === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return bytes.slice(0, 8).every((byte, index) => byte === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  return bytes.slice(0, 4).every((byte, index) => byte === [0x52, 0x49, 0x46, 0x46][index]) &&
    bytes.slice(8, 12).every((byte, index) => byte === [0x57, 0x45, 0x42, 0x50][index]);
}

export function decodeUtf8(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes);
  } catch (error) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "SVG must be UTF-8 text", cause: error });
  }
}
