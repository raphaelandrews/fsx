import type { Metadata } from "next";

import { siteConfig } from "@/lib/site";
import { RatingUpdate } from "../components/rating-update";

export const metadata: Metadata = {
  title: "Atualização de rating",
  description: "Processo de atualização de rating.",
  openGraph: {
    url: `${siteConfig.url}/showcase/atualizacao-rating`,
    title: "Atualização de rating",
    description: "Processo de atualização de rating.",
    siteName: "Atualização de rating",
  },
};

export default function Page() {
  return <RatingUpdate />;
}
