import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const publicOutput = fileURLToPath(new URL("../apps/web/dist/client/", import.meta.url));
const routes = ["sobre", "normas-tecnicas"];

for (const route of routes) {
  const html = await readFile(`${publicOutput}/${route}/index.html`, "utf8");
  const canonical = `https://www.fsx.org.br/${route}`;

  if (!/<title>[^<]+<\/title>/.test(html)) throw new Error(`Missing title in prerendered /${route}`);
  if (!/<meta name="description" content="[^"]+"/.test(html)) {
    throw new Error(`Missing description in prerendered /${route}`);
  }
  if (!html.includes(`<link rel="canonical" href="${canonical}"`)) {
    throw new Error(`Incorrect canonical URL in prerendered /${route}`);
  }
}

console.info(`Prerendered SEO metadata verified for ${routes.length} routes.`);
