// Runs the built worker (dist/server) in Miniflare against a freshly migrated D1
// seeded with production-sized synthetic data (scripts/worker-harness.ts) and
// checks SSR status codes, metadata, HTML size budgets, and error HTML.
// Run after `bun run build`.
import { startWorker } from "./worker-harness";

const SITE_URL = "https://www.fsx.org.br";

type Check = {
  path: string;
  status: number;
  location?: string;
  title?: string;
  canonical?: string | null;
  contains?: string[];
  maxKB?: number;
};

// Synthetic rows follow packages/api/scripts/production-counts.json, so HTML sizes
// reflect the real data volume. Player 1 has the longest tournament history.
// Budgets (uncompressed KB, including dehydrated query data) are ~1.5x the size
// measured on 2026-10-02; refresh the counts file and budgets together.
const PLAYER = { id: 1, name: "Jogador Sintético 1" };
const POST = { slug: "noticia-sintetica-1", title: "Notícia sintética 1" };

const checks: Check[] = [
  { path: "/", status: 200, maxKB: 175, canonical: `${SITE_URL}/`, contains: ["Notícia sintética"] },
  { path: "/ratings", status: 200, maxKB: 210, title: "Ratings de Xadrez", canonical: `${SITE_URL}/ratings`, contains: ["Jogador Sintético"] },
  { path: "/ratings?page=2", status: 200, maxKB: 210, title: "Página 2", canonical: `${SITE_URL}/ratings?page=2` },
  { path: "/ratings?clube=%5B%22Clube%203%22%5D", status: 200, maxKB: 210, canonical: `${SITE_URL}/ratings` },
  { path: "/noticias", status: 200, maxKB: 85, canonical: `${SITE_URL}/noticias` },
  { path: `/noticias/${POST.slug}`, status: 200, maxKB: 60, title: POST.title, canonical: `${SITE_URL}/noticias/${POST.slug}` },
  { path: "/noticias/nao-existe", status: 404, maxKB: 15 },
  { path: `/jogadores/${PLAYER.id}`, status: 200, maxKB: 150, title: PLAYER.name, canonical: `${SITE_URL}/jogadores/${PLAYER.id}` },
  { path: "/jogadores/999999", status: 404, maxKB: 15 },
  { path: "/jogadores/abc", status: 404, maxKB: 15 },
  { path: "/comunicados", status: 200, maxKB: 115, canonical: `${SITE_URL}/comunicados` },
  { path: "/comunicados/1", status: 200, maxKB: 55, canonical: `${SITE_URL}/comunicados/1` },
  { path: "/comunicados/999999", status: 404, maxKB: 15 },
  { path: "/titulados", status: 200, maxKB: 195 },
  { path: "/membros", status: 200, maxKB: 145 },
  { path: "/circuitos", status: 200, maxKB: 225 },
  { path: "/campeoes", status: 200, maxKB: 75 },
  { path: "/tv-sergipe", status: 200, maxKB: 250 },
  // The roster loads on click; a large page means birth dates leaked into the HTML.
  { path: "/swiss-manager", status: 200, maxKB: 60, contains: ["Baixar Excel"] },
  { path: "/pagina-inexistente", status: 404, maxKB: 15 },
  { path: "/dashboard", status: 307, location: "/login" },
  { path: "/dashboard/players/1", status: 307, location: "/login" },
  { path: "/sitemap.xml", status: 200, maxKB: 400, contains: [`${SITE_URL}/jogadores/${PLAYER.id}`, `${SITE_URL}/noticias/${POST.slug}`] },
];

const UNSAFE_PATTERNS = [/\n\s+at \S+ \(/, /SQLITE_/, /D1_ERROR/, /Failed query:/];

function attribute(html: string, pattern: RegExp): string | null {
  return pattern.exec(html)?.[1] ?? null;
}

const miniflare = await startWorker({ origin: "http://localhost", dataset: "production" });

const failures: string[] = [];
const titles = new Map<string, string>();

try {
  for (const check of checks) {
    const startedAt = performance.now();
    const response = await miniflare.dispatchFetch(`http://localhost${check.path}`, { redirect: "manual" });
    const body = await response.text();
    const problems: string[] = [];

    if (response.status !== check.status) problems.push(`status ${response.status}, expected ${check.status}`);
    if (check.location !== undefined) {
      const location = response.headers.get("location") ?? "";
      if (!location.startsWith(check.location)) problems.push(`location "${location}", expected ${check.location}`);
    }
    if (check.title !== undefined) {
      const title = attribute(body, /<title>([^<]*)<\/title>/) ?? "";
      if (!title.includes(check.title)) problems.push(`title "${title}" lacks "${check.title}"`);
    }
    if (check.canonical !== undefined) {
      const canonical = attribute(body, /<link[^>]*rel="canonical"[^>]*href="([^"]*)"/);
      if (canonical !== check.canonical) problems.push(`canonical "${canonical}", expected "${check.canonical}"`);
    }
    const sizeKB = new TextEncoder().encode(body).byteLength / 1024;
    if (check.maxKB !== undefined && sizeKB > check.maxKB) {
      problems.push(`HTML ${sizeKB.toFixed(1)} KB exceeds the ${check.maxKB} KB budget`);
    }
    const isHtml = response.headers.get("content-type")?.includes("text/html");
    if (response.status === 200 && isHtml) {
      const description = attribute(body, /<meta name="description" content="([^"]*)"/);
      if (!description?.trim()) problems.push("missing meta description");
      const title = attribute(body, /<title>([^<]*)<\/title>/) ?? "";
      const owner = titles.get(title);
      if (owner && !check.path.startsWith("/ratings?clube=")) problems.push(`title "${title}" duplicates ${owner}`);
      else titles.set(title, check.path);
    }
    for (const text of check.contains ?? []) {
      if (!body.includes(text)) problems.push(`body lacks "${text}"`);
    }
    for (const pattern of UNSAFE_PATTERNS) {
      if (pattern.test(body)) problems.push(`body leaks internals matching ${pattern}`);
    }

    if (problems.length) failures.push(`${check.path}: ${problems.join("; ")}`);
    else console.log(`ok ${check.status} ${check.path} (${sizeKB.toFixed(1)} KB, ${Math.round(performance.now() - startedAt)} ms)`);
  }
} finally {
  await miniflare.dispose();
}

if (failures.length) {
  console.error(`\nSSR check failed:\n${failures.map((failure) => `  - ${failure}`).join("\n")}`);
  process.exit(1);
}
console.log(`\nSSR verified for ${checks.length} routes.`);
