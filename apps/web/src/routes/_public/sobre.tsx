import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  Book01Icon,
  LandmarkIcon,
  Link02Icon,
  Mail02Icon,
  ScrollIcon,
  Target01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { Link, createFileRoute } from "@tanstack/react-router";

import { Announcement } from "@/components/announcement";
import { PageHeader } from "@/components/page-header";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";

export const Route = createFileRoute("/_public/sobre")({
  head: () =>
    buildSeo({
      title: withBrand("Sobre a Federação"),
      description:
        "História, finalidades e contatos da Federação Sergipana de Xadrez, fundada em 1989 e filiada à Confederação Brasileira de Xadrez (CBX).",
      path: "/sobre",
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Sobre", path: "/sobre" },
      ]),
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
  { label: "Normas técnicas", to: "/normas-tecnicas", icon: Book01Icon },
  { label: "Membros", to: "/membros", icon: UserGroupIcon },
] as const;

const CONTACT = "presidente@fsx.org.br";

function RouteComponent() {
  return (
    <>
      <PageHeader
        icon={ScrollIcon}
        description="História, finalidades e contatos da Federação Sergipana de Xadrez."
        title="Sobre"
      />

      <section aria-label="A FSX">
        <Announcement icon={LandmarkIcon} label="A FSX" />
        <div className="space-y-4 px-3 text-base text-reading leading-relaxed sm:text-lg">
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

      <section aria-label="Finalidades" className="mt-6">
        <Announcement icon={Target01Icon} label="Finalidades" />
        <ul className="list-disc space-y-2 pr-3 pl-8 text-base text-reading leading-relaxed marker:text-muted-foreground">
          {finalidades.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section aria-label="Links" className="mt-6">
        <Announcement icon={Link02Icon} label="Links" />
        <ul className="grid sm:grid-cols-2">
          {links.map((link) => (
            <li key={link.to} className="m-1">
              <Link to={link.to} className={rowClass}>
                <RowIcon icon={link.icon} />
                <span className="flex-1 font-semibold">{link.label}</span>
                <HugeiconsIcon icon={ArrowRight01Icon} className={arrowClass} aria-hidden />
              </Link>
            </li>
          ))}
          <li className="m-1">
            <a href={`mailto:${CONTACT}`} className={rowClass}>
              <RowIcon icon={Mail02Icon} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold">E-mail</span>
                <span className="truncate text-muted-foreground text-sm">{CONTACT}</span>
              </span>
              <HugeiconsIcon icon={ArrowUpRight01Icon} className={arrowClass} aria-hidden />
            </a>
          </li>
        </ul>
      </section>
    </>
  );
}

const rowClass =
  "group flex items-center gap-3 rounded-md p-3 text-base transition-colors duration-200 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring";
const arrowClass =
  "size-4 shrink-0 text-muted-foreground transition-[color,translate] duration-200 group-hover:translate-x-0.5 group-hover:text-foreground";

function RowIcon({ icon }: { icon: typeof Book01Icon }) {
  return (
    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-foreground" aria-hidden>
      <HugeiconsIcon icon={icon} className="size-4" strokeWidth={1.75} />
    </span>
  );
}
