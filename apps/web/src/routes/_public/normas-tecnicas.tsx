import {
  Book01Icon,
  ChartBarLineIcon,
  Medal01Icon,
} from "@hugeicons/core-free-icons"
import { createFileRoute } from "@tanstack/react-router"

import { Accordion } from "@fsx/ui/components/accordion"

import { Announcement } from "@/components/announcement"
import { NormasItem } from "@/components/normas-tecnicas/normas-item"
import { ratingVariations, titulations } from "@/components/normas-tecnicas/data"

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
})

function RouteComponent() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Announcement icon={Book01Icon} label="Normas Técnicas" />

      <section className="mb-0">
        <Announcement icon={Medal01Icon} label="Titulações" className="text-sm" />

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
        <Announcement
          icon={ChartBarLineIcon}
          label="Variação de Rating"
          className="text-sm"
          topSeparator
        />

        <Accordion className="flex flex-col">
          {ratingVariations.map((item, index) => (
            <NormasItem
              key={item.title}
              value={`rating-${index}`}
              title={item.title}
              description={item.description}
              isLast={index === ratingVariations.length - 1}
            >
              {item.content}
            </NormasItem>
          ))}
        </Accordion>
      </section>
    </div>
  )
}
