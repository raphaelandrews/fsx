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
  if (!html.includes(`<meta property="og:url" content="${canonical}"`)) {
    throw new Error(`og:url does not match the canonical URL in prerendered /${route}`);
  }
  if (/<meta name="robots" content="[^"]*noindex/.test(html)) {
    throw new Error(`Prerendered /${route} is marked noindex`);
  }
  if (!/<script[^>]+type="module"[^>]+src="\/assets\/[^"]+\.js"/.test(html) && !/import\(["']\/assets\/[^"']+\.js["']\)/.test(html)) {
    throw new Error(`Prerendered /${route} does not load the client entry, so it would not hydrate`);
  }
}

console.info(`Prerendered SEO metadata verified for ${routes.length} routes.`);
