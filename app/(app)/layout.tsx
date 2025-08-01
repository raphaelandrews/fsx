import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";

import { siteConfig } from "@/lib/site";
import { OG_IMAGE } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: ["FSX", "Federação Sergipana de Xadrez", "Sergipe", "xadrez"],
  authors: [
    {
      name: "Raphael Andrews",
      url: "https://ndrws.dev/",
    },
  ],
  creator: "Raphael Andrews",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: OG_IMAGE,
    creator: "@_ndrws",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: `${siteConfig.url}/site.webmanifest`,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
}
