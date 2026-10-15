import type { Metadata } from "next";

import { getData } from "./data";
import { siteConfig } from "@/lib/site";

import { Client } from "./client";

export const metadata: Metadata = {
  title: "Sergipano Bullet",
  description: "Campeonato Sergipano Bullet de Xadrez.",
  openGraph: {
    url: `${siteConfig.url}/sergipe-masters`,
    title: "Sergipano Bullet",
    description: "Campeonato Sergipano Bullet de Xadrez.",
    siteName: "Sergipano Bullet",
  },
};

export default async function Page() {
  const cup = await getData();
  return <Client cup={cup} />;
}
