import { ChartBarLineIcon, Medal01Icon } from "@hugeicons/core-free-icons";
import { createFileRoute } from "@tanstack/react-router";

import { Accordion } from "@fsx/ui/components/accordion";

import { Announcement } from "@/components/announcement";
import { DottedSeparator } from "@/components/dotted-separator";
import { NormasItem } from "@/components/normas-tecnicas/normas-item";
import { ratingVariations, titulations } from "@/components/normas-tecnicas/data";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/_public/normas-tecnicas")({
  head: () => ({
    meta: [
      { title: "Normas Técnicas - FSX" },
      {
        name: "description",
        content: "Normas técnicas da Federação Sergipana de Xadrez.",
      },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <PageHeader
        description="Regras, títulos e critérios oficiais da Federação Sergipana de Xadrez."
        title="Normas Técnicas"
      />

      <section className="mb-0">
        <Announcement icon={Medal01Icon} label="Titulações" className="text-sm" />
        <DottedSeparator />

        <Accordion className="flex flex-col">
          {titulations.map((item, index) => (
            <NormasItem
              key={item.title}
              value={`item-${index}`}
              title={item.title}
              description={item.description}
              isLast={index === titulations.length - 1}
            >
              {item.content}
            </NormasItem>
          ))}
        </Accordion>
      </section>

      <section className="mb-0">
        <DottedSeparator />
        <Announcement icon={ChartBarLineIcon} label="Variação de Rating" className="text-sm" />
        <DottedSeparator />

        <Accordion className="flex flex-col">
          {ratingVariations.map((item, index) => (
            <NormasItem
              key={item.title}
              value={`item-${index}`}
              title={item.title}
              description={item.description}
              isLast={index === ratingVariations.length - 1}
            >
              {item.content}
            </NormasItem>
          ))}
        </Accordion>
      </section>
    </>
  );
}
