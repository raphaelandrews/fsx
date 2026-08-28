import { LandmarkIcon, Link02Icon, Target01Icon } from "@hugeicons/core-free-icons";
import { createFileRoute } from "@tanstack/react-router";

import { Announcement } from "@/components/announcement";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_public/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre - FSX" },
      {
        name: "description",
        content: "Documentos e história da Federação Sergipana de Xadrez.",
      },
    ],
  }),
  component: RouteComponent,
});

const finalidades = [
  "Administrar o xadrez no Estado de Sergipe e desenvolver o xadrez em todas as suas modalidades e manifestações;",
  "Difundir, incentivar e desenvolver o xadrez no Estado de Sergipe, em todas as suas modalidades e manifestações;",
  "Dirigir a prática do xadrez em nível estadual, estabelecendo os regulamentos e condições necessárias para a sua boa organização e realização;",
  "Promover, direta ou indiretamente, competições, exibições, jogos e outras atividades de xadrez;",
  "Promover, direta ou indiretamente, cursos e outras atividades visando ao aprimoramento técnico do xadrez;",
  "Representar o xadrez sergipano junto à CBX e suas filiadas;",
  "Promover o registro de competições e demais atividades de xadrez realizadas em território sergipano;",
  "Conceder títulos, diplomas e prêmios relacionados às atividades de xadrez, bem como aqueles de natureza honorífica;",
  "Promover, direta ou indiretamente, a capacitação de enxadristas, técnicos, instrutores, árbitros e demais pessoas envolvidas nas atividades do xadrez.",
];

const links = [
  { label: "Normas técnicas", href: "/normas-tecnicas" },
  { label: "Membros", href: "/membros" },
  { label: "fsx.presidente@gmail.com", href: "mailto:fsx.presidente@gmail.com" },
];

function RouteComponent() {
  return (
    <>
      <PageHeader
        description="História, finalidades e contatos da Federação Sergipana de Xadrez."
        title="Sobre"
      />

      <section className="mb-0">
        <Announcement icon={LandmarkIcon} label="A FSX" className="text-sm" />

        <div className="space-y-3 px-4 py-3 text-sm leading-relaxed text-foreground">
          <p>
            A Federação Sergipana de Xadrez foi fundada em 11 de dezembro de 1989 pelas sociedades
            desportivas Cotinguiba Esporte Clube, Associação Atlética de Sergipe, Clube Esportivo
            Sergipe e Clube dos Empregados da Petrobras.
          </p>
          <p>
            A FSX é filiada diretamente à Confederação Brasileira de Xadrez (CBX) e, indiretamente,
            à Federação Internacional de Xadrez (FIDE).
          </p>
        </div>
      </section>

      <section className="mb-0">
        <Announcement icon={Target01Icon} label="Finalidades" className="text-sm" />

        <div className="flex flex-col">
          {finalidades.map((item, index) => (
            <SobreItem key={index}>
              <div className="flex items-start gap-2">
                <span className="shrink-0 text-muted-foreground">•</span>
                <p className="text-sm text-foreground">{item}</p>
              </div>
            </SobreItem>
          ))}
        </div>
      </section>

      <section className="mb-0">
        <Announcement icon={Link02Icon} label="Links" className="text-sm" />

        <div className="flex flex-col">
          {links.map((link, index) => (
            <a
              key={index}
              className="flex items-center gap-2 p-3 text-sm text-link transition-all hover:underline"
              href={link.href}
              rel="noreferrer"
              target={
                link.href.startsWith("http") || link.href.startsWith("mailto")
                  ? "_blank"
                  : undefined
              }
            >
              {link.label}
            </a>
          ))}
        </div>
      </section>
    </>
  );
}

function SobreItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="m-1">
      <div className={`p-3 transition-all hover:bg-muted/50 ${className ?? ""}`}>{children}</div>
    </div>
  );
}
