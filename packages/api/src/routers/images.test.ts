import { describe, expect, test } from "bun:test";
import { TRPCError } from "@trpc/server";

import { base64ToBytes, hasImageSignature, MAX_BASE64_LENGTH } from "../image-validation";

describe("image payload validation", () => {
  test("rejects malformed base64", () => {
    expect(() => base64ToBytes("not base64!")).toThrow(TRPCError);
  });

  test("decodes valid base64", () => {
    expect(base64ToBytes(btoa("valid image payload")).byteLength).toBe(19);
  });

  test("distinguishes supported signatures from MIME spoofing", () => {
    const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(hasImageSignature(png, "image/png")).toBe(true);
    expect(hasImageSignature(png, "image/jpeg")).toBe(false);
    expect(hasImageSignature(new Uint8Array([60, 115, 118, 103]), "image/png")).toBe(false);
  });

  test("rejects oversized encoded input before decoding", () => {
    expect(() => base64ToBytes("A".repeat(MAX_BASE64_LENGTH + 1))).toThrow(TRPCError);
  });
});
