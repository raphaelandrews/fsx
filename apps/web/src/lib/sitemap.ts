import { SITE_URL } from "./seo";

const STATIC_PATHS = [
  "/",
  "/noticias",
  "/ratings",
  "/campeoes",
  "/circuitos",
  "/comunicados",
  "/titulados",
  "/tv-sergipe",
  "/bullet",
  "/membros",
  "/sobre",
  "/normas-tecnicas",
  "/links",
] as const;

export interface SitemapPost {
  slug: string;
  updatedAt: string | Date | null;
}

function formatLastModified(value: string | Date | null): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function urlEntry(path: string, lastModified?: string): string {
  const loc = new URL(path, SITE_URL).toString();
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    ...(lastModified ? [`    <lastmod>${lastModified}</lastmod>`] : []),
    "  </url>",
  ].join("\n");
}

export function renderSitemap(posts: SitemapPost[], playerIds: number[]): string {
  const entries = [
    ...STATIC_PATHS.map((path) => urlEntry(path)),
    ...posts.map((post) =>
      urlEntry(`/noticias/${encodeURIComponent(post.slug)}`, formatLastModified(post.updatedAt)),
    ),
    ...playerIds.map((id) => urlEntry(`/jogadores/${id}`)),
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");
}
