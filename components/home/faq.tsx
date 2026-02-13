import { FileQuestionIcon } from "lucide-react"

import { Section } from "./section"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"
import { DottedX } from "@/components/dotted-x"

export function FAQ() {
	return (
		<Section icon={FileQuestionIcon} label="FAQ" main={false}>
			<DottedX>
				<Accordion collapsible type="single">
					<AccordionItem value="item-1">
						<AccordionTrigger className="text-left pt-0">
							O que preciso fazer para jogar torneios?
						</AccordionTrigger>
						<AccordionContent>
							Para jogar os torneios da FSX, basta preencher o formulário e pagar
							a taxa de inscrição. Os links são disponibilizados no site e no
							instagram (
							<a
								className="text-blue-500 hover:underline"
								href="https://www.instagram.com/xadrezsergipe"
								rel="noreferrer"
								target="_blank"
							>
								@xadrezsergipe
							</a>
							). Alguns torneios são válidos para rating CBX e FIDE, nesses casos,
							é necessário também preencher o{" "}
							<a
								className="text-blue-500 hover:underline"
								href="https://www.cbx.org.br/cadastro"
								rel="noreferrer"
								target="_blank"
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
								className="text-blue-500 hover:underline"
								href="https://forms.gle/5JXbBckcWB33EprW8"
								rel="noreferrer"
								target="_blank"
							>
								formulário de atualização de dados
							</a>{" "}
							para adicionar algumas informações ao seu perfil. Não é necessário
							pagar taxas, somente as de inscrição dos torneios.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="item-3">
						<AccordionTrigger className="text-left pb-0">
							Como fico sabendo quando terá torneio?
						</AccordionTrigger>
						<AccordionContent className="pb-0">
							Acesse nosso{" "}
							<a
								className="text-blue-500 hover:underline"
								href="https://docs.google.com/spreadsheets/d/1FqWEWcpcRzW0r4wnsjLOIFmrwFkcqd9gnA7Lk1ZZ5uM"
								rel="noreferrer"
								target="_blank"
							>
								Calendário
							</a>
							. Os torneios são divulgados no site e instagram (
							<a
								className="text-blue-500 hover:underline"
								href="https://www.instagram.com/xadrezsergipe"
								rel="noreferrer"
								target="_blank"
							>
								@xadrezsergipe
							</a>
							).
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</DottedX>
		</Section>
	)
}
