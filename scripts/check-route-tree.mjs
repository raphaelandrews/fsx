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
