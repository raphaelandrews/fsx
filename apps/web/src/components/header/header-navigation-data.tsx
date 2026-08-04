import {
  Home01Icon,
  SparklesIcon,
  Book01Icon,
  CrownIcon,
  UserGroupIcon,
  Calendar01Icon,
  NewsIcon,
  Megaphone01Icon,
  BarChartIcon,
  Medal01Icon,
  ScrollIcon,
  Bookmark01Icon,
  Link01Icon,
  BookBookmark01Icon,
  Database01Icon,
} from "@hugeicons/core-free-icons"

type NavigationItem = {
  label: string
  href: string
  icon: typeof Home01Icon
  description?: string
  target: string
  items?: NavigationItem[]
}

type Navigation = () => NavigationItem[]

export const navigationData: Navigation = () => [
  {
    label: "Home",
    href: "/",
    icon: Home01Icon,
    target: "_self",
  },
  {
    label: "Destaques",
    href: "#",
    icon: SparklesIcon,
    target: "_self",
    items: [
      {
        label: "Notícias",
        description: "Informações mais recentes.",
        href: "/noticias",
        icon: NewsIcon,
        target: "_self",
      },
      {
        label: "Rating",
        description: "Tabelas de rating.",
        href: "/ratings",
        icon: BarChartIcon,
        target: "_self",
      },
      {
        label: "Circuitos",
        description: "Circuitos de Sergipe.",
        href: "/circuitos",
        icon: Medal01Icon,
        target: "_self",
      },
      {
        label: "Comunicados",
        description: "Informações.",
        href: "/comunicados",
        icon: Megaphone01Icon,
        target: "_self",
      },
      {
        label: "Campeões",
        description: "Galeria dos campeões.",
        href: "/campeoes",
        icon: CrownIcon,
        target: "_self",
      },
    ],
  },
  {
    label: "Institucional",
    href: "##",
    icon: BookBookmark01Icon,
    target: "_self",
    items: [
      {
        label: "Titulados",
        description: "Jogadores titulados.",
        href: "/titulados",
        icon: Bookmark01Icon,
        target: "_self",
      },
      {
        label: "Membros",
        description: "Diretoria e árbitros.",
        href: "/membros",
        icon: UserGroupIcon,
        target: "_self",
      },
      {
        label: "Normas Técnicas",
        description: "Normas.",
        href: "/normas-tecnicas",
        icon: Book01Icon,
        target: "_self",
      },
      {
        label: "Atualização de Rating",
        description: "Processo de atualização.",
        href: "/showcase/atualizacao-rating",
        icon: Database01Icon,
        target: "_self",
      },
      {
        label: "Sobre",
        description: "Documentos e história.",
        href: "/sobre",
        icon: ScrollIcon,
        target: "_self",
      },
    ],
  },
  {
    label: "Calendário",
    href: "https://docs.google.com/spreadsheets/d/1FqWEWcpcRzW0r4wnsjLOIFmrwFkcqd9gnA7Lk1ZZ5uM",
    icon: Calendar01Icon,
    target: "_blank",
  },
  {
    label: "Links",
    description: "Principais links.",
    href: "/links",
    icon: Link01Icon,
    target: "_blank",
  },
]
