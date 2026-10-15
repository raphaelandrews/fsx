import { toIsoTimestamp } from "./format";
import { SITE_URL } from "./seo";

const STATIC_PATHS = [
  "/",
  "/noticias",
  "/ratings",
  "/campeoes",
  "/torneios",
  "/calendario",
  "/circuitos",
  "/estatisticas",
  "/clubes",
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

function urlEntry(path: string, lastModified?: string): string {
  const loc = new URL(path, SITE_URL).toString();
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    ...(lastModified ? [`    <lastmod>${lastModified}</lastmod>`] : []),
    "  </url>",
  ].join("\n");
}

export interface SitemapEntries {
  posts: SitemapPost[];
  playerIds: number[];
  tournamentIds: number[];
  announcementIds: number[];
  clubIds: number[];
}

export function renderSitemap({ posts, playerIds, tournamentIds, announcementIds, clubIds }: SitemapEntries): string {
  const entries = [
    ...STATIC_PATHS.map((path) => urlEntry(path)),
    ...posts.map((post) =>
      urlEntry(`/noticias/${encodeURIComponent(post.slug)}`, toIsoTimestamp(post.updatedAt)?.slice(0, 10)),
    ),
    ...playerIds.map((id) => urlEntry(`/jogadores/${id}`)),
    ...tournamentIds.map((id) => urlEntry(`/torneios/${id}`)),
    ...announcementIds.map((id) => urlEntry(`/comunicados/${id}`)),
    ...clubIds.map((id) => urlEntry(`/clubes/${id}`)),
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    "</urlset>",
    "",
  ].join("\n");
}
