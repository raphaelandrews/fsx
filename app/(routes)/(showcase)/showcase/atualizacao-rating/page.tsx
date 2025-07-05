import { Metadata } from "next";

import { siteConfig } from "@/lib/site";
import { RatingUpdate } from "../components/rating-update";

export const metadata: Metadata = {
  title: "Atualização de rating",
  description: "Processo de atualização de rating da FSX.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${siteConfig.url}/showcase/atualizacao-rating`,
    title: "FSX | Atualização de rating",
    description: "Processo de atualização de rating da FSX.",
    siteName: "FSX | Atualização de rating",
    images: [
      {
        url: `${siteConfig.url}/og/og.jpg`,
        width: 1920,
        height: 1080,
      },
    ],
  },
};

export default function Page() {
  return <RatingUpdate />;
}
