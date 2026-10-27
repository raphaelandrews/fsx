import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "@fsx/env/server";

import { adminProcedure, router } from "../index";
import { base64ToBytes, decodeUtf8, hasImageSignature, MAX_BASE64_LENGTH } from "../lib/image-validation";
import {
  formatBytes,
  MEDIA_EXTENSIONS,
  MEDIA_KINDS,
  MEDIA_MIMES,
  MEDIA_POLICIES,
  SVG_MIME,
  type MediaMime,
} from "../media-kinds";
import { ensureSvgViewBox, findSvgProblem } from "../lib/svg-safety";
import { deleteMediaUrl, urlToKey } from "../services/media-storage";

function badRequest(message: string): never {
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

function validatedBody(bytes: Uint8Array, mime: MediaMime): Uint8Array {
  if (mime !== SVG_MIME) {
    if (!hasImageSignature(bytes, mime)) badRequest("Image content does not match its type");
    return bytes;
  }
  const source = decodeUtf8(bytes);
  const problem = findSvgProblem(source);
  if (problem) badRequest(problem);
  return new TextEncoder().encode(ensureSvgViewBox(source));
}

export const imagesRouter = router({
  upload: adminProcedure
    .input(
      z.object({
        kind: z.enum(MEDIA_KINDS),
        mime: z.enum(MEDIA_MIMES),
        // Base64 payload: cropped or downscaled client-side, or an SVG as-is.
        data: z.string().min(16).max(MAX_BASE64_LENGTH),
      }),
    )
    .mutation(async ({ input }) => {
      const policy = MEDIA_POLICIES[input.kind];
      if (!policy.mimes.includes(input.mime)) badRequest("This image type is not allowed here");

      const bytes = base64ToBytes(input.data);
      if (bytes.byteLength < policy.minBytes) badRequest("Image is too small");
      if (bytes.byteLength > policy.maxBytes) {
        badRequest(`Image is too large (max ${formatBytes(policy.maxBytes)})`);
      }
      const body = validatedBody(bytes, input.mime);

      const key = `${input.kind}/${crypto.randomUUID()}.${MEDIA_EXTENSIONS[input.mime]}`;
      await env.IMAGES.put(key, body, {
        httpMetadata: { contentType: input.mime },
      });

      return { url: `/api/media/${key}` };
    }),

  delete: adminProcedure.input(z.object({ url: z.string().max(2_048) })).mutation(async ({ ctx, input }) => {
    const key = urlToKey(input.url);
    if (!key) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid image URL" });
    }
    // An image a record still uses is kept, so a stale form cannot break another page.
    await deleteMediaUrl(ctx.db, input.url);
    return { ok: true };
  }),
});
