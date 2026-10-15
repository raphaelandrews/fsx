import {
  HomeIcon,
  type LucideIcon,
  SparklesIcon,
  BookIcon,
  TrophyIcon,
  UsersIcon,
  CalendarIcon,
  NewspaperIcon,
  MegaphoneIcon,
  BarChart2Icon,
  MedalIcon,
  ScrollIcon,
  BookmarkIcon,
  LinkIcon,
  BookCopyIcon,
  DatabaseIcon,
} from "lucide-react";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  target: string;
  items?: NavigationItem[];
};

type Navigation = () => NavigationItem[];

export const navigationData: Navigation = () => [
  {
    label: "Home",
    href: "/",
    icon: HomeIcon,
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
        icon: NewspaperIcon,
        target: "_self",
      },
      {
        label: "Rating",
        description: "Tabelas de rating.",
        href: "/ratings",
        icon: BarChart2Icon,
        target: "_self",
      },
      {
        label: "Circuitos",
        description: "Circuitos de Sergipe.",
        href: "/circuitos",
        icon: MedalIcon,
        target: "_self",
      },
      {
        label: "Comunicados",
        description: "Informações.",
        href: "/comunicados",
        icon: MegaphoneIcon,
        target: "_self",
      },
      {
        label: "Campeões",
        description: "Galeria dos campeões.",
        href: "/campeoes",
        icon: TrophyIcon,
        target: "_self",
      },
    ],
  },
  {
    label: "Institucional",
    href: "##",
    icon: BookCopyIcon,
    target: "_self",
    items: [
      {
        label: "Titulados",
        description: "Jogadores titulados.",
        href: "/titulados",
        icon: BookmarkIcon,
        target: "_self",
      },
      {
        label: "Membros",
        description: "Diretoria e árbitros.",
        href: "/membros",
        icon: UsersIcon,
        target: "_self",
      },
      {
        label: "Normas Técnicas",
        description: "Normas.",
        href: "/normas-tecnicas",
        icon: BookIcon,
        target: "_self",
      },
      {
        label: "Atualização de Rating",
        description: "Processo de atualização.",
        href: "/showcase/atualizacao-rating",
        icon: DatabaseIcon,
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
    icon: CalendarIcon,
    target: "_blank",
  },
  {
    label: "Links",
    description: "Principais links.",
    href: "/links",
    icon: LinkIcon,
    target: "_blank",
  },
];
