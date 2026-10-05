import { ChartBarLineIcon, Medal01Icon, Book01Icon } from "@hugeicons/core-free-icons";
import { createFileRoute } from "@tanstack/react-router";

import { Announcement } from "@/components/announcement";
import { ratingVariations, titulations } from "@/components/normas-tecnicas/data";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@fsx/ui/components/accordion";

import { PageHeader } from "@/components/page-header";
import { breadcrumbJsonLd, buildSeo, withBrand } from "@/lib/seo";

export const Route = createFileRoute("/_public/normas-tecnicas")({
  head: () =>
    buildSeo({
      title: withBrand("Normas Técnicas"),
      description:
        "Regras, titulações e critérios de variação de rating oficiais da Federação Sergipana de Xadrez.",
      path: "/normas-tecnicas",
      jsonLd: breadcrumbJsonLd([
        { name: "Início", path: "/" },
        { name: "Normas Técnicas", path: "/normas-tecnicas" },
      ]),
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader icon={Book01Icon}
        description="Regras, títulos e critérios oficiais da Federação Sergipana de Xadrez."
        title="Normas Técnicas"
      />

      <section aria-label="Titulações">
        <Announcement icon={Medal01Icon} label="Titulações" />
        <Accordion className="mx-3 w-auto">
          {titulations.map((item) => (
            <AccordionItem key={item.title} value={item.title}>
              <AccordionTrigger>
                <span className="flex flex-col gap-0.5">
                  <span>{item.title}</span>
                  <span className="font-medium text-muted-foreground text-sm">{item.description}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>{item.content}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section aria-label="Variação de rating" className="mt-6">
        <Announcement icon={ChartBarLineIcon} label="Variação de rating" />
        {ratingVariations.map((item) => (
          <div key={item.title} className="px-3">
            <p className="text-muted-foreground text-sm">{item.description}</p>
            {item.content}
          </div>
        ))}
      </section>
    </>
  );
}
