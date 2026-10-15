type SiteConfig = {
	name: string
	description: string
	url: string
	ogImage: string
	links: {
		twitter: string
		github: string
	}
}

export const siteConfig: SiteConfig = {
	name: "Federação Sergipana de Xadrez",
	description:
		"A Federação Sergipana de Xadrez (FSX) organiza e promove o xadrez em Sergipe desde 1989!",
	url: "https://www.fsx.org.br",
	ogImage: "https://www.fsx.org.br/og/og.jpg",
	links: {
		twitter: "https://twitter.com/_andrewssh",
		github: "https://github.com/raphaelandrews",
	},
}
