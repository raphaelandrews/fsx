export type SiteConfig = {
  name: string
  description: string
  keywords: string[]
  authorsName: string
  authorsUrl: string
  creator: string
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
  keywords: ["FSX", "Federação Sergipana de Xadrez", "Sergipe", "xadrez"],
  authorsName: "Raphael Andrews",
  authorsUrl: "https://ndrws.dev",
  creator: "Raphael Andrews",
  url: "https://www.fsx.org.br",
  ogImage: "https://www.fsx.org.br/og/og.jpg",
  links: {
    twitter: "https://twitter.com/_ndrws",
    github: "https://github.com/raphaelandrews",
  },
}