import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../apps/web/src");
const routesDirectory = join(root, "routes");
const routeTreePath = join(root, "routeTree.gen.ts");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path);
    if (!entry.isFile() || ![".ts", ".tsx"].includes(extname(entry.name))) return [];
    if (entry.name.startsWith("-") || entry.name.endsWith(".test.ts")) return [];
    return [path];
  }));
  return nested.flat();
}

const sourceRoutes = await walk(routesDirectory);
const generatedTree = await readFile(routeTreePath, "utf8");
const generatedImports = [...generatedTree.matchAll(/from ['"](\.\/routes\/[^'"]+)['"]/g)]
  .map(([, path]) => path);
const generatedSet = new Set(generatedImports);
const expectedSet = new Set(sourceRoutes.map((path) => {
  const relativePath = relative(routesDirectory, path).replaceAll("\\", "/");
  return `./routes/${relativePath.slice(0, -extname(relativePath).length)}`;
}));

const missing = [...expectedSet].filter((path) => !generatedSet.has(path));
const stale = [...generatedSet].filter((path) => !expectedSet.has(path));
if (missing.length || stale.length) {
  if (missing.length) console.error(`Route tree missing source routes:\n${missing.join("\n")}`);
  if (stale.length) console.error(`Route tree has stale route imports:\n${stale.join("\n")}`);
  process.exitCode = 1;
} else {
  console.info(`Generated route tree matches ${sourceRoutes.length} source routes.`);
}

// Every public page route must be listed in the sitemap or excluded on purpose.
const SITEMAP_EXCLUDED = new Map([
  ["/login", "admin sign-in"],
  ["/$", "catch-all not-found page"],
  ["/swiss-manager", "noindex export tool, reached by direct link"],
]);

function urlPathOf(file) {
  const relativePath = relative(routesDirectory, file).replaceAll("\\", "/");
  if (relativePath.startsWith("_auth/") || relativePath.startsWith("api/") || relativePath.startsWith("sitemap")) {
    return null;
  }
  const withoutExtension = relativePath.slice(0, -extname(relativePath).length);
  if (withoutExtension === "__root" || withoutExtension.endsWith("route")) return null;
  const segments = withoutExtension
    .split("/")
    .flatMap((segment) => segment.split("."))
    .filter((segment) => !segment.startsWith("_") && segment !== "index");
  return `/${segments.join("/")}`;
}

const sitemapSource = await readFile(join(root, "lib/sitemap.ts"), "utf8");
const staticBlock = sitemapSource.match(/STATIC_PATHS = \[([\s\S]*?)\]/)?.[1] ?? "";
const staticPaths = new Set([...staticBlock.matchAll(/"([^"]+)"/g)].map(([, path]) => path));
const dynamicPrefixes = new Set([...sitemapSource.matchAll(/urlEntry\(`(\/[a-z-]+)\/\$\{/g)].map(([, prefix]) => prefix));

const uncovered = sourceRoutes
  .map(urlPathOf)
  .filter((path) => path !== null)
  .filter((path) => {
    if (SITEMAP_EXCLUDED.has(path)) return false;
    const dynamic = path.match(/^(.*)\/\$[a-zA-Z]+$/);
    return dynamic ? !dynamicPrefixes.has(dynamic[1]) : !staticPaths.has(path);
  });

if (uncovered.length) {
  console.error(
    `Public routes missing from the sitemap (add them to lib/sitemap.ts or SITEMAP_EXCLUDED):\n${[...new Set(uncovered)].join("\n")}`,
  );
  process.exitCode = 1;
} else {
  console.info("Every public route is in the sitemap or explicitly excluded.");
}
