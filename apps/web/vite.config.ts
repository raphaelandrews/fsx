import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import alchemy from "alchemy/cloudflare/tanstack-start";
import { defineConfig } from "vite-plus";
const alchemyConfigPath = fileURLToPath(
  new URL("./.alchemy/local/wrangler.jsonc", import.meta.url),
);
const shouldUseAlchemy = existsSync(alchemyConfigPath);
const cloudflareWorkersShimPath = fileURLToPath(
  new URL("../../packages/env/src/cloudflare-local.ts", import.meta.url),
);
const cloudflareWorkersAlias: Record<string, string> = shouldUseAlchemy
  ? {}
  : {
      "cloudflare:workers": cloudflareWorkersShimPath,
    };

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
    alias: cloudflareWorkersAlias,
  },
  plugins: [
    // SheetJS is only imported dynamically in the browser (spreadsheet import and export). The server build
    // would still bundle its 820 KB chunk into the Worker, so it gets an empty module instead.
    {
      name: "fsx:xlsx-client-only",
      enforce: "pre",
      resolveId(id) {
        if (id === "xlsx" && this.environment?.name !== "client") return "\0xlsx-client-only";
      },
      load(id) {
        if (id === "\0xlsx-client-only") return "export {};";
      },
    },
    tailwindcss(),
    // Only truly static pages are prerendered at build time (instant TTFB, never
    // stale). Data-driven pages render on the server per request so they are
    // always fresh and never bake stale/empty HTML (which previously left
    // Suspense boundaries unresolved and triggered React #419).
    tanstackStart({
      pages: [
        { path: "/sobre", prerender: { enabled: true } },
        { path: "/normas-tecnicas", prerender: { enabled: true } },
      ],
      prerender: {
        enabled: true,
        crawlLinks: false,
        autoStaticPathsDiscovery: false,
        failOnError: true,
      },
    }),
    viteReact(),
    ...(shouldUseAlchemy ? [alchemy({ configPath: alchemyConfigPath })] : []),
  ],
});
