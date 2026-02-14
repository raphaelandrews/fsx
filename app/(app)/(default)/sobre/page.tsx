import type { Metadata } from "next"
import { ScrollIcon, LandmarkIcon, GoalIcon, Link2Icon } from "lucide-react"

import { siteConfig } from "@/lib/site"

import { PageHeader } from "@/components/ui/page-header"
import { Announcement } from "@/components/announcement"
import { DottedSeparator } from "@/components/dotted-separator"
import { SobreItem } from "./components/sobre-item"

export const metadata: Metadata = {
	title: "Sobre",
	description: "Documentos e história da Federação Sergipana de Xadrez.",
	openGraph: {
		url: `${siteConfig.url}/sobre`,
		title: "Sobre",
		description: "Documentos e história da Federação Sergipana de Xadrez.",
		siteName: "Sobre",
	},
};

export default function Page() {
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

	return (
		<PageHeader icon={ScrollIcon} label="Sobre">
			<section className="mb-0">
				<Announcement icon={LandmarkIcon} label="A FSX" className="text-sm" />

				<div className="px-4 py-3 text-sm text-foreground space-y-3 leading-relaxed">
					<p>
						A Federação Sergipana de Xadrez foi fundada em 11 de dezembro de 1989
						pelas sociedades desportivas Cotinguiba Esporte Clube, Associação
						Atlética de Sergipe, Clube Esportivo Sergipe e Clube dos Empregados da
						Petrobras.
					</p>
					<p>
						A FSX é filiada diretamente à Confederação Brasileira de Xadrez (CBX)
						e, indiretamente, à Federação Internacional de Xadrez (FIDE).
					</p>
				</div>

				<DottedSeparator className="w-full" />
			</section>

			<section className="mb-0">
				<Announcement icon={GoalIcon} label="Finalidades" className="text-sm" />

				<div className="flex flex-col">
					{finalidades.map((item, index) => (
						<SobreItem key={index} isLast={index === finalidades.length - 1}>
							<div className="flex items-start gap-2">
								<span className="text-muted-foreground shrink-0">•</span>
								<p className="text-sm text-foreground">{item}</p>
							</div>
						</SobreItem>
					))}
				</div>

				<DottedSeparator className="w-full" />
			</section>

			<section className="mb-0">
				<Announcement icon={Link2Icon} label="Links" className="text-sm" />

				<div className="flex flex-col">
					{links.map((link, index) => (
						<SobreItem key={index} isLast={index === links.length - 1}>
							<a
								className="text-sm text-primary flex items-center gap-2"
								href={link.href}
								rel="noreferrer"
								target={link.href.startsWith("http") || link.href.startsWith("mailto") ? "_blank" : undefined}
							>
								{link.label}
							</a>
						</SobreItem>
					))}
				</div>
			</section>
		</PageHeader>
	)
}
