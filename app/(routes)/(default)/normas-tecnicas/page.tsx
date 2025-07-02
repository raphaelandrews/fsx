import type { Metadata } from "next";
import { BookIcon } from "lucide-react";

import { siteConfig } from "@/lib/site";

import { Announcement } from "@/components/announcement";
import { PageHeader, PageHeaderHeading } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Normas Técnicas",
  description: "Normas técnicas, documentos e história da FSX.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${siteConfig.url}/normas-tecnicas`,
    title: "FSX | Normas Técnicas",
    description: "Normas técnicas, documentos e história da FSX.",
    siteName: "FSX | Normas Técnicas",
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
        <Announcement icon={BookIcon} />
        <PageHeaderHeading>Normas Técnicas</PageHeaderHeading>
      </PageHeader>

      <div className="space-y-12">
        <section className="prose prose-gray dark:prose-invert">
          <h2 className="text-2xl font-semibold tracking-tight">
            Titulações
          </h2>

          <div className="rounded-lg border p-6 mt-6">
            <h3 className="text-xl font-medium mb-4">
              GMS - Grande Mestre Sergipano
            </h3>
            <div className="space-y-4">
              <p>
                Obterá o título de GRANDE MESTRE SERGIPANO o enxadrista que:
              </p>
              <div className="pl-4 border-l-2 border-muted space-y-2">
                <p>1. Atingir 2400 de rating FSX em qualquer ritmo.</p>
                <div>
                  <p>
                    2. Figurar entre os 3 primeiros colocados, ao menos quatro
                    vezes, na categoria Absoluto de algum dos seguintes
                    campeonatos:
                  </p>
                  <div className="ml-6 mt-2 space-y-1 text-muted-foreground">
                    <p>• Campeonato Sergipano Blitz</p>
                    <p>• Campeonato Sergipano Rápido</p>
                    <p>• Campeonato Sergipano Absoluto</p>
                    <p>• Campeonato Sergipano de Equipes</p>
                    <p>
                      • Campeonatos aprovados pela diretoria da FSX para compor
                      norma
                    </p>
                  </div>
                </div>
                <p>
                  3. Conquistar por duas vezes o Campeonato Sergipano Absoluto
                  ou conquistar três títulos nos campeonatos listados acima.
                </p>
              </div>
              <div className="bg-muted/50 p-4 rounded-md mt-4">
                <p>
                  É necessário cumprir o item 1 e 2 ou 3 para a obtenção da
                  titulação.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6 mt-6">
            <h3 className="text-xl font-medium mb-4">MSE - MESTRE SERGIPANO</h3>
            <div className="space-y-4">
              <p>Obterá o título de MESTRE SERGIPANO, o enxadrista que:</p>
              <div className="pl-4 border-l-2 border-muted space-y-2">
                <p>1. Atingir 2300 de rating FSX em qualquer ritmo.</p>
                <p>
                  2. Figurar entre os 3 primeiros colocados, ao menos duas vezes
                  nos campeonatos listados anteriormente.
                </p>
                <p>
                  3. Conquistar o Campeonato Sergipano Absoluto ou conquistar
                  dois títulos nos campeonatos listados anteriormente.
                </p>
              </div>
              <div className="bg-muted/50 p-4 rounded-md mt-4">
                <p>
                  É necessário cumprir o item 1 e 2 ou 3 para a obtenção da
                  titulação.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6 mt-6">
            <h3 className="text-xl font-medium mb-4">
              CMS - Candidato a Mestre Sergipano
            </h3>
            <div className="space-y-4">
              <p>
                Obterá o título de CANDIDATO A MESTRE SERGIPANO o enxadrista
                que:
              </p>
              <div className="pl-4 border-l-2 border-muted space-y-2">
                <p>1. Atingir 2200 de rating FSX em qualquer ritmo.</p>
                <p>
                  2. Figurar entre os 5 primeiros colocados, ao menos uma vez,
                  na categoria Absoluto dos campeonatos listados anteriormente.
                </p>
              </div>
              <div className="bg-muted/50 p-4 rounded-md mt-4">
                <p>
                  É necessário cumprir ambos os itens 1 e 2 para a obtenção da
                  titulação.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6 mt-6">
            <h3 className="text-xl font-medium mb-4">
              MJS - Mestre Júnior Sergipano
            </h3>
            <div className="space-y-4">
              <p>
                Obterá o título de MESTRE JÚNIOR SERGIPANO o enxadrista que:
              </p>
              <div className="pl-4 border-l-2 border-muted space-y-2">
                <p>1. Atingir 2100 de rating FSX em qualquer ritmo.</p>
                <p>2. Tiver 18 anos ou menos.</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-md mt-4">
                <p>
                  É necessário cumprir ambos os itens 1 e 2 para a obtenção da
                  titulação.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  No ano em que o enxadrista completa 19 anos, perderá a
                  referida titulação.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6 mt-6">
            <h3 className="text-xl font-medium mb-4">
              MMS - Mestre Mirim Sergipano
            </h3>
            <div className="space-y-4">
              <p>Obterá o título de MESTRE MIRIM SERGIPANO o enxadrista que:</p>
              <div className="pl-4 border-l-2 border-muted space-y-2">
                <p>1. Atingir 2000 de rating FSX em qualquer ritmo.</p>
                <p>2. Tiver 14 anos ou menos.</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-md mt-4">
                <p>
                  É necessário cumprir ambos os itens 1 e 2 para a obtenção da
                  titulação.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  No ano em que o enxadrista completa 15 anos, perderá a
                  referida titulação.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6 mt-6">
            <h3 className="text-xl font-medium mb-4">
              MFS - Mestre Feminina Sergipana
            </h3>
            <div className="space-y-4">
              <p>
                Obterá o título de MESTRE FEMININA SERGIPANA a enxadrista que:
              </p>
              <div className="pl-4 border-l-2 border-muted space-y-2">
                <p>1. Atingir 2150 de rating FSX em qualquer ritmo.</p>
                <p>2. Ser pessoa do gênero feminino.</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-md mt-4">
                <p>
                  É necessário cumprir ambos os itens 1 e 2 para a obtenção da
                  titulação.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border p-6 mt-6">
            <h3 className="text-xl font-medium mb-4">
              MSHC - Mestre Sergipano Honoris Causa
            </h3>
            <div className="space-y-4">
              <p>
                Obterá o título de MESTRE SERGIPANO HONORIS CAUSA o enxadrista
                que:
              </p>
              <div className="pl-4 border-l-2 border-muted space-y-2">
                <p>
                  Contribuiu ativamente para a promoção do xadrez no estado de
                  Sergipe.
                </p>
              </div>
              <div className="bg-muted/50 p-4 rounded-md mt-4">
                <p>
                  A avaliação para conceder a referida titulação ficará a
                  critério dos membros que compõem a diretoria da Federação
                  Sergipana de Xadrez.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="prose prose-gray dark:prose-invert">
          <h2 className="text-2xl font-semibold tracking-tight">
            Variação de rating
          </h2>

          <div className="grid gap-4 mt-6">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="font-mono text-sm px-2 py-1 bg-muted rounded">
                  k = 1
                </div>
                <p>
                  Em torneios que só contenham atletas com idade menor ou igual
                  a 18 anos e o jogador possua rating superior ou igual a 2100
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="font-mono text-sm px-2 py-1 bg-muted rounded">
                  k = 5
                </div>
                <p>
                  Em torneios que só contenham atletas com idade menor ou igual
                  a 18 anos
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="font-mono text-sm px-2 py-1 bg-muted rounded">
                  k = 10
                </div>
                <p>
                  O enxadrista possua rating igual ou superior a 2400 pontos
                </p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <div className="font-mono text-sm px-2 py-1 bg-muted rounded">
                  k = 20
                </div>
                <p>Nas demais situações</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
