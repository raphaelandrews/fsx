import { FileQuestionIcon } from "lucide-react"

import { Section } from "./section"
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion"
import { DottedX } from "@/components/dotted-x"
import { DottedSeparator } from "@/components/dotted-separator"

const FAQ_ITEMS = [
	{
		value: "item-1",
		question: "O que preciso fazer para jogar torneios?",
		answer: (
			<>
				Para jogar os torneios da FSX, basta preencher o formulário e pagar a
				taxa de inscrição. Os links são disponibilizados no site e no instagram
				({" "}
				<a
					className="text-link-foreground hover:underline"
					href="https://www.instagram.com/xadrezsergipe"
					rel="noreferrer"
					target="_blank"
				>
					@xadrezsergipe
				</a>
				). Alguns torneios são válidos para rating CBX e FIDE, nesses casos, é
				necessário também preencher o{" "}
				<a
					className="text-link-foreground hover:underline"
					href="https://www.cbx.org.br/cadastro"
					rel="noreferrer"
					target="_blank"
				>
					Formulário de Cadastro da CBX
				</a>{" "}
				.
			</>
		),
	},
	{
		value: "item-2",
		question:
			"Como faço para me cadastrar na FSX? É preciso pagar alguma taxa/anuidade?",
		answer: (
			<>
				O cadastro do enxadrista é feito pela FSX assim que ele joga seu
				primeiro torneio, não é preciso fazer nenhuma solicitação. Assim que o
				enxadrista estiver cadastrado, ele pode preencher o{" "}
				<a
					className="text-link-foreground hover:underline"
					href="https://forms.gle/5JXbBckcWB33EprW8"
					rel="noreferrer"
					target="_blank"
				>
					formulário de atualização de dados
				</a>{" "}
				para adicionar algumas informações ao seu perfil. Não é necessário pagar
				taxas, somente as de inscrição dos torneios.
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
					className="text-link-foreground hover:underline"
					href="https://docs.google.com/spreadsheets/d/1FqWEWcpcRzW0r4wnsjLOIFmrwFkcqd9gnA7Lk1ZZ5uM"
					rel="noreferrer"
					target="_blank"
				>
					Calendário
				</a>
				. Os torneios são divulgados no site e instagram (
				<a
					className="text-link-foreground hover:underline"
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
]

export function FAQ() {
	return (
		<Section icon={FileQuestionIcon} label="FAQ" main={false}>
			<DottedX className="p-0">
				<Accordion collapsible type="single" className="flex flex-col">
					{FAQ_ITEMS.map((item, index) => (
						<div key={item.value}>
							<AccordionItem value={item.value} className="border-b-0">
								<div className="m-1">
									<AccordionTrigger className="text-left hover:no-underline hover:bg-muted/50 px-2 py-3 rounded-none">
										{item.question}
									</AccordionTrigger>
									<AccordionContent className="px-2 pb-2">{item.answer}</AccordionContent>
								</div>
							</AccordionItem>
							{index !== FAQ_ITEMS.length - 1 && (
								<DottedSeparator className="w-full" />
							)}
						</div>
					))}
				</Accordion>
			</DottedX>
		</Section>
	)
}
