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
  Analytics01Icon,
  Trophy,
} from "@hugeicons/core-free-icons"

type NavigationItem = {
  label: string
  href: string
  icon: typeof Home01Icon
  target: string
  items?: NavigationItem[]
}

export const NAVIGATION: NavigationItem[] = [
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
        href: "/noticias",
        icon: NewsIcon,
        target: "_self",
      },
      {
        label: "Rating",
        href: "/ratings",
        icon: BarChartIcon,
        target: "_self",
      },
      {
        label: "Torneios",
        href: "/torneios",
        icon: Trophy,
        target: "_self",
      },
      {
        label: "Circuitos",
        href: "/circuitos",
        icon: Medal01Icon,
        target: "_self",
      },
      {
        label: "Estatísticas",
        href: "/estatisticas",
        icon: Analytics01Icon,
        target: "_self",
      },
      {
        label: "Clubes",
        href: "/clubes",
        icon: UserGroupIcon,
        target: "_self",
      },
      {
        label: "Comunicados",
        href: "/comunicados",
        icon: Megaphone01Icon,
        target: "_self",
      },
      {
        label: "Campeões",
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
        href: "/titulados",
        icon: Bookmark01Icon,
        target: "_self",
      },
      {
        label: "Membros",
        href: "/membros",
        icon: UserGroupIcon,
        target: "_self",
      },
      {
        label: "Normas Técnicas",
        href: "/normas-tecnicas",
        icon: Book01Icon,
        target: "_self",
      },
      {
        label: "Sobre",
        href: "/sobre",
        icon: ScrollIcon,
        target: "_self",
      },
    ],
  },
  {
    label: "Calendário",
    href: "/calendario",
    icon: Calendar01Icon,
    target: "_self",
  },
  {
    label: "Links",
    href: "/links",
    icon: Link01Icon,
    target: "_blank",
  },
]
