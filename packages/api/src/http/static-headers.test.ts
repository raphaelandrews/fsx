import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL as NodeURL } from "node:url";

import { SECURITY_HEADERS } from "./security-headers";

const read = (relative: string) => readFileSync(fileURLToPath(new NodeURL(relative, import.meta.url)), "utf8");
const file = read("../../../../apps/web/public/_headers");

function blockOf(path: string) {
  const lines = file.split("\n");
  const start = lines.indexOf(path);
  if (start === -1) return undefined;
  const headers: Record<string, string> = {};
  for (const line of lines.slice(start + 1)) {
    if (!line.startsWith("  ")) break;
    const [name, ...rest] = line.trim().split(": ");
    headers[name!] = rest.join(": ");
  }
  return headers;
}

describe("public/_headers", () => {
  test("hashed bundles are immutable", () => {
    expect(blockOf("/assets/*")).toEqual({ "Cache-Control": "public, max-age=31536000, immutable" });
  });

  test("every prerendered page carries the same security headers as server-rendered ones", () => {
    const prerendered = [...read("../../../../apps/web/vite.config.ts").matchAll(/\{ path: "([^"]+)", prerender/g)].map((match) => match[1]!);
    expect(prerendered.length).toBeGreaterThan(0);
    for (const path of prerendered) expect(blockOf(path), path).toEqual(SECURITY_HEADERS);
  });
});
