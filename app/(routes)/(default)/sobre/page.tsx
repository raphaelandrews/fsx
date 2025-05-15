import type { Metadata } from "next";
import { ScrollIcon } from "lucide-react";

import { siteConfig } from "@/lib/site";

import { Announcement } from "@/components/announcement";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Sobre",
  description: "Normas técnicas, documentos e história da FSX.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${siteConfig.url}/sobre`,
    title: "FSX | Sobre",
    description: "Normas técnicas, documentos e história da FSX.",
    siteName: "FSX | Sobre",
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
  return (
    <>
      <PageHeader>
        <Announcement icon={ScrollIcon} />
        <PageHeaderHeading>Sobre</PageHeaderHeading>
        <PageHeaderDescription>
          Normas técnicas, documentos e história da FSX.
        </PageHeaderDescription>
      </PageHeader>

      <section className="text-base">
        <h2 className="font-heading mt-8 scroll-m-20 text-xl font-semibold tracking-tight">
          A FSX
        </h2>
        <p className="leading-7 mt-3">
          A Federação Sergipana de Xadrez foi fundada em 11 de dezembro de 1989
          pelas sociedades desportivas Cotinguiba Esporte Clube, Associação
          Atlética de Sergipe, Clube Esportivo Sergipe e Clube dos Empregados da
          Petrobras.
        </p>
        <p className="leading-7 mt-2">
          A FSX é filiada diretamente à Confederação Brasileira de Xadrez (CBX)
          e, indiretamente, à Federação Internacional de Xadrez (FIDE).
        </p>
      </section>

      <section className="text-base">
        <h2 className="font-heading scroll-m-20 text-xl font-semibold tracking-tight mt-5">
          Finalidades
        </h2>
        <ol className="[&>li]:leading-7 [&>li]:mt-1 mt-3">
          <li>
            - Administrar o xadrez no Estado de Sergipe e desenvolver o xadrez
            em todas as suas modalidades e manifestações;
          </li>
          <li>
            - Difundir, incentivar e desenvolver o xadrez no Estado de Sergipe,
            em todas as suas modalidades e manifestações;
          </li>
          <li>
            - Dirigir a prática do xadrez em nível estadual, estabelecendo os
            regulamentos e condições necessárias para a sua boa organização e
            realização;
          </li>
          <li>
            - Promover, direta ou indiretamente, competições, exibições, jogos e
            outras atividades de xadrez;
          </li>
          <li>
            - Promover, direta ou indiretamente, cursos e outras atividades
            visando ao aprimoramento técnico do xadrez;
          </li>
          <li>
            {" "}
            - Representar o xadrez sergipano junto à CBX e suas filiadas;
          </li>
          <li>
            - Promover o registro de competições e demais atividades de xadrez
            realizadas em território sergipano;
          </li>
          <li>
            - Conceder títulos, diplomas e prêmios relacionados às atividades de
            xadrez, bem como aqueles de natureza honorífica;
          </li>
          <li>
            - Promover, direta ou indiretamente, a capacitação de enxadristas,
            técnicos, instrutores, árbitros e demais pessoas envolvidas nas
            atividades do xadrez.
          </li>
        </ol>
      </section>

      <section>
        <h2 className="font-heading scroll-m-20 text-xl font-semibold tracking-tight mt-5">
          Links
        </h2>

        <div className="flex flex-col gap-1 mt-3">
          <a
            href="https://docs.google.com/document/d/1hTfftEHO2dUrDzUxYu9AFuW5kKXqIxqQ"
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:underline"
          >
            Normas técnicas
          </a>
          <a href="/membros" className="text-blue-500 hover:underline">
            Membros
          </a>
          <a
            href="mailto:fsx.presidente@gmail.com"
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:underline"
          >
            fsx.presidente@gmail.com
          </a>
        </div>
      </section>
    </>
  );
}
