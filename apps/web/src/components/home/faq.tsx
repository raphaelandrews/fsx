import { HelpCircleIcon } from "@hugeicons/core-free-icons";

import { Section } from "./section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@fsx/ui/components/accordion";

const FAQ_ITEMS = [
  {
    value: "item-1",
    question: "O que preciso fazer para jogar torneios?",
    answer: (
      <>
        Para jogar os torneios da FSX, basta preencher o formulário e pagar a taxa de inscrição. Os
        links são disponibilizados no site e no Instagram (
        <a
          className="link-inline"
          href="https://www.instagram.com/xadrezsergipe"
          rel="noreferrer"
          target="_blank"
        >
          @xadrezsergipe
        </a>
        ). Alguns torneios são válidos para rating CBX e FIDE, nesses casos, é necessário também
        preencher o{" "}
        <a
          className="link-inline"
          href="https://www.cbx.org.br/cadastro"
          rel="noreferrer"
          target="_blank"
        >
          Formulário de Cadastro da CBX
        </a>
        .
      </>
    ),
  },
  {
    value: "item-2",
    question: "Como faço para me cadastrar na FSX? É preciso pagar alguma taxa/anuidade?",
    answer: (
      <>
        O cadastro do enxadrista é feito pela FSX assim que ele joga seu primeiro torneio, não é
        preciso fazer nenhuma solicitação. Assim que o enxadrista estiver cadastrado, ele pode
        preencher o{" "}
        <a
          className="link-inline"
          href="https://forms.gle/5JXbBckcWB33EprW8"
          rel="noreferrer"
          target="_blank"
        >
          formulário de atualização de dados
        </a>{" "}
        para adicionar algumas informações ao seu perfil. Não é necessário pagar taxas, somente as
        de inscrição dos torneios.
      </>
    ),
  },
  {
    value: "item-3",
    question: "Como fico sabendo quando serão os próximos torneios?",
    answer: (
      <>
        Acesse nosso{" "}
        <a
          className="link-inline"
          href="https://docs.google.com/spreadsheets/d/1FqWEWcpcRzW0r4wnsjLOIFmrwFkcqd9gnA7Lk1ZZ5uM"
          rel="noreferrer"
          target="_blank"
        >
          Calendário
        </a>
        . Os torneios são divulgados no site e no Instagram (
        <a
          className="link-inline"
          href="https://www.instagram.com/xadrezsergipe"
          rel="noreferrer"
          target="_blank"
        >
          @xadrezsergipe
        </a>
        ).
      </>
    ),
  },
];

export function FAQ() {
  return (
    <Section icon={HelpCircleIcon} label="FAQ" main={false}>
      <Accordion className="mx-auto max-w-3xl px-3">
        {FAQ_ITEMS.map((item) => (
          <AccordionItem key={item.value} value={item.value}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}
