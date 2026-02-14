import type { Metadata } from "next";
import { BookIcon, MedalIcon, BarChart2Icon } from "lucide-react";

import { siteConfig } from "@/lib/site";

import { titulations, ratingVariations } from "./data";
import { NormasItem } from "./components/normas-item";
import { Accordion } from "@/components/ui/accordion";
import { PageHeader } from "@/components/ui/page-header"
import { Announcement } from "@/components/announcement";
import { DottedSeparator } from "@/components/dotted-separator";

export const metadata: Metadata = {
  title: "Normas Técnicas",
  description: "Normas técnicas da Federação Sergipana de Xadrez.",
  openGraph: {
    url: `${siteConfig.url}/normas-tecnicas`,
    title: "Normas Técnicas",
    description: "Normas técnicas da Federação Sergipana de Xadrez.",
    siteName: "Normas Técnicas",
  },
};

export default function Page() {
  return (
    <PageHeader icon={BookIcon} label="Normas Técnicas">
      <section className="mb-0">
            <Announcement icon={MedalIcon} label="Titulações" className="text-sm" />

            <Accordion type="single" collapsible className="flex flex-col">
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
            <Announcement icon={BarChart2Icon} label="Variação de Rating" className="text-sm" topSeparator />

            <Accordion type="single" collapsible className="flex flex-col">
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
    </PageHeader>
  );
}