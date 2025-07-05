import type { Metadata } from "next";

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
        url: `/og?title=${encodeURIComponent("Atualização de rating")}`,
      },
    ],
  },
};

export default function Page() {
  return <RatingUpdate />;
}
