import { FileQuestionIcon } from "lucide-react";

import { HomeSection } from "@/components/home-section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function FAQ() {
  return (
    <HomeSection label="FAQ" icon={FileQuestionIcon} main={false}>
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger className="text-left">
            O que preciso fazer para jogar torneios?
          </AccordionTrigger>
          <AccordionContent>
            Para jogar os torneios da FSX, basta preencher o formulário e pagar
            a taxa de inscrição. Os links são disponibilizados no site e no
            instagram (
            <a
              href="https://www.instagram.com/xadrezsergipe"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              @xadrezsergipe
            </a>
            ). Alguns torneios são válidos para rating CBX e FIDE, nesses casos,
            é necessário também preencher o{" "}
            <a
              href="https://www.cbx.org.br/cadastro"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              Formulário de Cadastro da CBX
            </a>{" "}
            .
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger className="text-left">
            Como faço para me cadastrar na FSX? É preciso pagar alguma
            taxa/anuidade?
          </AccordionTrigger>
          <AccordionContent>
            O cadastro do enxadrista é feito pela FSX assim que ele joga seu
            primeiro torneio, não é preciso fazer nenhuma solicitação. Assim que
            o enxadrista estiver cadastrado, ele pode preencher o{" "}
            <a
              href="https://forms.gle/5JXbBckcWB33EprW8"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              formulário de atualização de dados
            </a>{" "}
            para adicionar algumas informações ao seu perfil. Não é necessário
            pagar taxas, somente as de inscrição dos torneios.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger className="text-left">
            Como fico sabendo quando terá torneio?
          </AccordionTrigger>
          <AccordionContent>
            Acesse nosso{" "}
            <a
              href="https://docs.google.com/spreadsheets/d/1FqWEWcpcRzW0r4wnsjLOIFmrwFkcqd9gnA7Lk1ZZ5uM"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              Calendário
            </a>
            . Os torneios são divulgados no site e instagram (
            <a
              href="https://www.instagram.com/xadrezsergipe"
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 hover:underline"
            >
              @xadrezsergipe
            </a>
            ).
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </HomeSection>
  );
}
