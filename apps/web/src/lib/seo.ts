export const SITE_URL = "https://www.fsx.org.br";
export const SITE_NAME = "Federação Sergipana de Xadrez";
export const SITE_SHORT_NAME = "FSX";
export const SITE_LOCALE = "pt_BR";
export const SITE_FOUNDED = "1989-12-11";
export const THEME_COLOR = "#4873ff";

export const DEFAULT_DESCRIPTION =
  "Site oficial da Federação Sergipana de Xadrez (FSX). Ratings, torneios, notícias, circuitos e campeões do xadrez em Sergipe.";

// Raster 1200x630 image; social platforms do not render SVG og:images.
export const DEFAULT_OG_IMAGE = "/og-image.png";

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, SITE_URL).toString();
}

// Use the entity image when it exists (any format, including WebP) and only
// fall back to the branded default when there is no image.
export function resolveOgImage(image?: string | null): string {
  return image ? absoluteUrl(image) : absoluteUrl(DEFAULT_OG_IMAGE);
}

/** Append the brand suffix used across page titles. */
export function withBrand(title: string): string {
  return `${title} | ${SITE_SHORT_NAME}`;
}

export interface SeoOptions {
  title: string;
  description?: string;
  /** Route path (with query) used for the canonical URL and og:url. */
  path?: string;
  image?: string | null;
  type?: "website" | "article" | "profile";
  noindex?: boolean;
  /** Emit a canonical link. Disable for noindex/utility pages. */
  canonical?: boolean;
  publishedTime?: string | null;
  modifiedTime?: string | null;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export interface SeoScript {
  type: string;
  children: string;
}

/**
 * Build the per-route `head` payload: title, description, canonical, robots and
 * Open Graph/Twitter tags. Route `head` values override the root defaults
 * because TanStack Router dedupes meta by `name`/`property` (last one wins).
 *
 * JSON-LD is emitted through the `scripts` option as `application/ld+json`
 * blocks — the React adapter types route `meta` as React `<meta>` props, which
 * does not include the `script:ld+json` descriptor.
 */
export function buildSeo(options: SeoOptions) {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    path = "/",
    image,
    type = "website",
    noindex = false,
    canonical = true,
    publishedTime,
    modifiedTime,
    jsonLd,
  } = options;

  const url = absoluteUrl(path);
  const imageUrl = resolveOgImage(image);

  const meta = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: noindex ? "noindex, nofollow" : "index, follow" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { property: "og:image", content: imageUrl },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: title },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: SITE_LOCALE },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
  ];

  if (publishedTime) {
    meta.push({ property: "article:published_time", content: publishedTime });
  }
  if (modifiedTime) {
    meta.push({ property: "article:modified_time", content: modifiedTime });
  }

  const scripts: SeoScript[] = [];
  if (jsonLd) {
    const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    for (const block of blocks) {
      scripts.push({ type: "application/ld+json", children: JSON.stringify(block) });
    }
  }

  const links = canonical ? [{ rel: "canonical", href: url }] : [];

  return { meta, links, scripts };
}

export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: SITE_SHORT_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/android-chrome-512x512.png"),
    foundingDate: SITE_FOUNDED,
    areaServed: { "@type": "State", name: "Sergipe" },
    sport: "Chess",
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: SITE_SHORT_NAME,
    url: SITE_URL,
    inLanguage: "pt-BR",
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleJsonLd(options: {
  title: string;
  path: string;
  image?: string | null;
  description?: string;
  datePublished?: string | null;
  dateModified?: string | null;
}): Record<string, unknown> {
  const imageUrl = resolveOgImage(options.image);
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: options.title,
    description: options.description,
    image: [imageUrl],
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(options.path) },
    datePublished: options.datePublished ?? undefined,
    dateModified: options.dateModified ?? options.datePublished ?? undefined,
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function personJsonLd(options: {
  name: string;
  path: string;
  image?: string | null;
  description?: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: options.name,
    description: options.description,
    image: options.image ? absoluteUrl(options.image) : undefined,
    url: absoluteUrl(options.path),
    memberOf: { "@type": "SportsOrganization", name: SITE_NAME, url: SITE_URL },
  };
}

/** Plain text from Markdown, for meta descriptions and other non-rendered contexts. */
export function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, "")
    .replace(/^\s*\|?\s*:?-{3,}.*$/gm, " ")
    .replace(/\|/g, " ")
    .replace(/[*_~`]+/g, "");
}

/** Truncate text for meta descriptions without cutting mid-word. */
export function truncate(text: string | null | undefined, max = 155): string {
  if (!text) return DEFAULT_DESCRIPTION;
  const clean = stripMarkdown(text).replace(/\s+/g, " ").trim();
  if (!clean) return DEFAULT_DESCRIPTION;
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max)}…`;
}
