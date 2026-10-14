import type { FeedRow } from "@fsx/api/http/feeds";

import { parseDbTimestamp } from "./format";
import { absoluteUrl, SITE_NAME, SITE_URL, truncate } from "./seo";

export const FEED_PATH = "/rss.xml";
const DESCRIPTION_CHARS = 300;

const escapeXml = (text: string) =>
  text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!);

function dated(row: FeedRow) {
  const date = parseDbTimestamp(row.createdAt);
  return { row, date: Number.isNaN(date.getTime()) ? new Date(0) : date };
}

/** RSS 2.0 for everything the federation publishes: news first by date, announcements mixed in. */
export function renderRss(rows: FeedRow[]): string {
  const items = rows.map(dated).sort((a, b) => b.date.getTime() - a.date.getTime());
  const built = items[0]?.date ?? new Date(0);

  const entries = items.map(({ row, date }) => {
    const link = absoluteUrl(row.path);
    return [
      "    <item>",
      `      <title>${escapeXml(row.title)}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
      `      <pubDate>${date.toUTCString()}</pubDate>`,
      `      <category>${row.kind === "post" ? "Notícias" : "Comunicados"}</category>`,
      `      <description>${escapeXml(truncate(row.teaser, DESCRIPTION_CHARS))}</description>`,
      "    </item>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(SITE_NAME)}</title>`,
    `    <link>${SITE_URL}</link>`,
    "    <description>Notícias e comunicados oficiais da Federação Sergipana de Xadrez.</description>",
    "    <language>pt-br</language>",
    `    <lastBuildDate>${built.toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${absoluteUrl(FEED_PATH)}" rel="self" type="application/rss+xml" />`,
    ...entries,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
