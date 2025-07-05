import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPlayerById, type PlayerById } from "@/db/queries";
import { siteConfig } from "@/lib/site";
import { Client } from "./client";

export async function generateMetadata({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getPlayerById(Number(resolvedParams.id));

  if (!data) {
    return {
      title: "Jogador não encontrado",
    };
  }

  const { name } = data;

  return {
    title: name,
    description: "Perfil do jogador na Federação Sergipana de Xadrez",
    openGraph: {
      type: "website",
      locale: "pt_BR",
      title: name,
      description: "Perfil do jogador na Federação Sergipana de Xadrez",
      siteName: `FSX | ${name}`,
      url: `${siteConfig.url}/jogadores/${resolvedParams.id}`,
      images: [
        {
          url: `/og?title=${encodeURIComponent(name)}`,
        },
      ],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;
  const data = await getPlayerById(Number(resolvedParams.id));

  if (!data) {
    notFound();
  }

  return <Client player={data as PlayerById} />;
}
