// Keeps the Cloudflare runtime toolchain pinned together: Alchemy's bundled
// Miniflare must match every workspace pin (otherwise seed/tests write to a
// different SQLite file than `alchemy dev` reads), and deploys, Miniflare test
// harnesses, and the workerd override must agree on the compatibility date.
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = async (path) => readFile(new URL(path, root), "utf8");
const json = async (path) => JSON.parse(await read(path));
const failures = [];

const rootPackage = await json("package.json");
const alchemyRange = rootPackage.workspaces.catalog.alchemy;
if (!/^\d+\.\d+\.\d+$/.test(alchemyRange)) failures.push(`catalog alchemy must be an exact version, got "${alchemyRange}"`);

const alchemyPackage = await json("packages/infra/node_modules/alchemy/package.json");
const alchemyMiniflare = alchemyPackage.dependencies?.miniflare;

for (const path of ["packages/api/package.json", "packages/db/package.json", "apps/web/package.json"]) {
  const pkg = await json(path);
  const pinned = pkg.devDependencies?.miniflare ?? pkg.dependencies?.miniflare;
  if (pinned !== alchemyMiniflare) failures.push(`${path} pins miniflare ${pinned}; alchemy ${alchemyPackage.version} uses ${alchemyMiniflare}`);
}

const wrangler = (await json("apps/web/package.json")).devDependencies?.wrangler;
if (!/^\d+\.\d+\.\d+$/.test(wrangler ?? "")) failures.push(`apps/web wrangler must be an exact version, got "${wrangler}"`);

const deployDate = (await read("packages/infra/alchemy.run.ts")).match(/COMPATIBILITY_DATE = "(\d{4}-\d{2}-\d{2})"/)?.[1];
if (!deployDate) failures.push("packages/infra/alchemy.run.ts must set COMPATIBILITY_DATE explicitly");
for (const path of ["packages/api/src/test-d1.ts", "apps/web/scripts/worker-harness.ts"]) {
  const date = (await read(path)).match(/compatibilityDate: "(\d{4}-\d{2}-\d{2})"/)?.[1];
  if (date !== deployDate) failures.push(`${path} uses compatibility date ${date}; deploys use ${deployDate}`);
}

const workerd = rootPackage.overrides?.workerd ?? "";
const workerdDate = workerd.match(/^1\.(\d{4})(\d{2})(\d{2})\./)?.slice(1).join("-");
if (!workerdDate) failures.push(`root override workerd must be pinned exactly, got "${workerd}"`);
else if (deployDate && workerdDate < deployDate) failures.push(`workerd ${workerd} predates compatibility date ${deployDate}`);

if (failures.length) {
  console.error(`Runtime pins are inconsistent:\n${failures.map((failure) => `  - ${failure}`).join("\n")}`);
  process.exitCode = 1;
} else {
  console.info(`Runtime pins consistent: alchemy ${alchemyPackage.version}, miniflare ${alchemyMiniflare}, workerd ${workerd}, compatibility date ${deployDate}.`);
}
