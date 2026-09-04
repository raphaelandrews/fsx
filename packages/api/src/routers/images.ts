import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "@fsx/env/server";

import { adminProcedure, router } from "../index";

const MIN_IMAGE_BYTES = 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function mimeToExt(mime: string): string {
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/gif") return "gif";
  return "webp";
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Strip the public path back down to the object key so a stored relative URL
// (e.g. `/api/media/players/uuid.webp`) can be deleted from R2.
export function urlToKey(url: string): string | null {
  const marker = "/api/media/";
  const idx = url.indexOf(marker);
  const key = idx === -1 ? url : url.slice(idx + marker.length);
  return key ? decodeURIComponent(key) : null;
}

export const imagesRouter = router({
  upload: adminProcedure
    .input(
      z.object({
        kind: z.enum(["players", "posts"]),
        mime: z.string().refine((v) => v.startsWith("image/"), "Expected an image mime type"),
        // Base64-encoded image payload (cropped client-side, ~KB range).
        data: z.string().min(16),
      }),
    )
    .mutation(async ({ input }) => {
      const bytes = base64ToBytes(input.data);
      if (bytes.byteLength < MIN_IMAGE_BYTES) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Image is too small" });
      }
      if (bytes.byteLength > MAX_IMAGE_BYTES) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Image is too large (max 5MB)" });
      }

      const key = `${input.kind}/${crypto.randomUUID()}.${mimeToExt(input.mime)}`;
      await env.IMAGES.put(key, bytes, {
        httpMetadata: { contentType: input.mime },
      });

      return { url: `/api/media/${key}` };
    }),

  delete: adminProcedure.input(z.object({ url: z.string() })).mutation(async ({ input }) => {
    const key = urlToKey(input.url);
    if (!key) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image URL" });
    }
    await env.IMAGES.delete(key);
    return { ok: true };
  }),
});
