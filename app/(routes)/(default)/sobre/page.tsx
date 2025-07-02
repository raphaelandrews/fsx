import type { Metadata } from "next"
import { ScrollIcon } from "lucide-react"

import { siteConfig } from "@/lib/site"

import { Announcement } from "@/components/announcement"
import { PageHeader, PageHeaderHeading } from "@/components/ui/page-header"

export const metadata: Metadata = {
	title: "Sobre",
	description: "Normas técnicas, documentos e história da FSX.",
	openGraph: {
		type: "website",
		locale: "pt_BR",
		url: `${siteConfig.url}/sobre`,
		title: "FSX | Sobre",
		description: "Normas técnicas, documentos e história da FSX.",
		siteName: "FSX | Sobre",
		images: [
			{
				url: `${siteConfig.url}/og/og.jpg`,
				width: 1920,
				height: 1080,
			},
		],
	},
}

export default function Page() {
	return (
		<>
			<PageHeader>
				<Announcement icon={ScrollIcon} />
				<PageHeaderHeading>Sobre</PageHeaderHeading>
			</PageHeader>

			<section className="text-base">
				<h2 className="mt-8 scroll-m-20 font-heading font-semibold text-xl tracking-tight">
					A FSX
				</h2>
				<p className="mt-3 leading-7">
					A Federação Sergipana de Xadrez foi fundada em 11 de dezembro de 1989
					pelas sociedades desportivas Cotinguiba Esporte Clube, Associação
					Atlética de Sergipe, Clube Esportivo Sergipe e Clube dos Empregados da
					Petrobras.
				</p>
				<p className="mt-2 leading-7">
					A FSX é filiada diretamente à Confederação Brasileira de Xadrez (CBX)
					e, indiretamente, à Federação Internacional de Xadrez (FIDE).
				</p>
			</section>

			<section className="text-base">
				<h2 className="mt-5 scroll-m-20 font-heading font-semibold text-xl tracking-tight">
					Finalidades
				</h2>
				<ol className="mt-3 [&>li]:mt-1 [&>li]:leading-7">
					<li>
						- Administrar o xadrez no Estado de Sergipe e desenvolver o xadrez
						em todas as suas modalidades e manifestações;
					</li>
					<li>
						- Difundir, incentivar e desenvolver o xadrez no Estado de Sergipe,
						em todas as suas modalidades e manifestações;
					</li>
					<li>
						- Dirigir a prática do xadrez em nível estadual, estabelecendo os
						regulamentos e condições necessárias para a sua boa organização e
						realização;
					</li>
					<li>
						- Promover, direta ou indiretamente, competições, exibições, jogos e
						outras atividades de xadrez;
					</li>
					<li>
						- Promover, direta ou indiretamente, cursos e outras atividades
						visando ao aprimoramento técnico do xadrez;
					</li>
					<li>
						{" "}
						- Representar o xadrez sergipano junto à CBX e suas filiadas;
					</li>
					<li>
						- Promover o registro de competições e demais atividades de xadrez
						realizadas em território sergipano;
					</li>
					<li>
						- Conceder títulos, diplomas e prêmios relacionados às atividades de
						xadrez, bem como aqueles de natureza honorífica;
					</li>
					<li>
						- Promover, direta ou indiretamente, a capacitação de enxadristas,
						técnicos, instrutores, árbitros e demais pessoas envolvidas nas
						atividades do xadrez.
					</li>
				</ol>
			</section>

			<section>
				<h2 className="mt-5 scroll-m-20 font-heading font-semibold text-xl tracking-tight">
					Links
				</h2>

				<div className="mt-3 flex flex-col gap-1">
					<a
						className="text-blue-500 hover:underline"
						href="/normas-tecnicas"
						rel="noreferrer"
						target="_blank"
					>
						Normas técnicas
					</a>
					<a className="text-blue-500 hover:underline" href="/membros">
						Membros
					</a>
					<a
						className="text-blue-500 hover:underline"
						href="mailto:fsx.presidente@gmail.com"
						rel="noreferrer"
						target="_blank"
					>
						fsx.presidente@gmail.com
					</a>
				</div>
			</section>
		</>
	)
}
