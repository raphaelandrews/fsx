import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath, URL as NodeURL } from "node:url";

const robots = readFileSync(fileURLToPath(new NodeURL("../../../../apps/web/public/robots.txt", import.meta.url)), "utf8");
const rules = robots.split("\n").filter((line) => /^(Allow|Disallow):/.test(line));

describe("robots.txt", () => {
  test("keeps the API closed but lets crawlers fetch share images and uploaded photos", () => {
    expect(rules).toContain("Disallow: /api/");
    expect(rules).toContain("Allow: /api/og/");
    expect(rules).toContain("Allow: /api/media/");
  });

  test("keeps the admin out and points at the sitemap", () => {
    expect(rules).toContain("Disallow: /dashboard");
    expect(rules).toContain("Disallow: /rating-update");
    expect(robots).toContain("Sitemap: https://www.fsx.org.br/sitemap.xml");
  });
});
