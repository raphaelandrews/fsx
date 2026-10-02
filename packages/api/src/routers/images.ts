import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "@fsx/env/server";

import { adminProcedure, router } from "../index";
import { base64ToBytes, hasImageSignature, IMAGE_MIMES, MAX_BASE64_LENGTH, MAX_IMAGE_BYTES, MIN_IMAGE_BYTES } from "../image-validation";


function mimeToExt(mime: (typeof IMAGE_MIMES)[number]): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return "webp";
}

// Strip the public path back down to the object key so a stored relative URL
// (e.g. `/api/media/players/uuid.webp`) can be deleted from R2.
export function urlToKey(url: string): string | null {
  const marker = "/api/media/";
  const idx = url.indexOf(marker);
  const key = idx === -1 ? url : url.slice(idx + marker.length);
  if (!key || key.length > 300 || !/^(players|posts)\/[a-f0-9-]+\.(jpg|png|webp)$/.test(key)) return null;
  try {
    return decodeURIComponent(key);
  } catch {
    return null;
  }
}

export const imagesRouter = router({
  upload: adminProcedure
    .input(
      z.object({
        kind: z.enum(["players", "posts"]),
        mime: z.enum(IMAGE_MIMES),
        // Base64-encoded image payload (cropped client-side, ~KB range).
        data: z.string().min(16).max(MAX_BASE64_LENGTH),
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
      if (!hasImageSignature(bytes, input.mime)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Image content does not match its type" });
      }

      const key = `${input.kind}/${crypto.randomUUID()}.${mimeToExt(input.mime)}`;
      await env.IMAGES.put(key, bytes, {
        httpMetadata: { contentType: input.mime },
      });

      return { url: `/api/media/${key}` };
    }),

  delete: adminProcedure.input(z.object({ url: z.string().max(2_048) })).mutation(async ({ input }) => {
    const key = urlToKey(input.url);
    if (!key) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image URL" });
    }
    await env.IMAGES.delete(key);
    return { ok: true };
  }),
});
