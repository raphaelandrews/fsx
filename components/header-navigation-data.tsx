import {
  Home,
  type LucideIcon,
  Sparkles,
  Book,
  Trophy,
  Users,
  Calendar,
  Newspaper,
  Megaphone,
  BarChart2,
  Medal,
  Scroll,
  Bookmark,
  Store,
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
    icon: Home,
    target: "_self",
  },
  {
    label: "Destaques",
    href: "#",
    icon: Sparkles,
    target: "_self",
    items: [
      {
        label: "Notícias",
        description: "Acesse as informações mais recentes da FSX.",
        href: "/noticias",
        icon: Newspaper,
        target: "_self",
      },
      {
        label: "Rating",
        description: "Confira as tabelas de rating.",
        href: "/ratings",
        icon: BarChart2,
        target: "_self",
      },
      {
        label: "Circuitos",
        description:
          "Confira a classificação dos circuitos de Xadrez de Sergipe.",
        href: "/circuitos",
        icon: Medal,
        target: "_self",
      },
      {
        label: "Comunicados",
        description: "Divulgação de titulações e outras informações.",
        href: "/comunicados",
        icon: Megaphone,
        target: "_self",
      },
    ],
  },
  {
    label: "Institucional",
    href: "##",
    icon: Book,
    target: "_self",
    items: [
      {
        label: "Campeões",
        description: "Galeria dos campeões e campeãs Sergipanos.",
        href: "/campeoes",
        icon: Trophy,
        target: "_self",
      },
      {
        label: "Titulados",
        description: "Jogadores titulados da FSX.",
        href: "/titulados",
        icon: Bookmark,
        target: "_self",
      },
      {
        label: "Membros",
        description: "Diretoria e árbitros da FSX.",
        href: "/membros",
        icon: Users,
        target: "_self",
      },
      {
        label: "Sobre",
        description: "Normas técnicas, documentos e história da FSX.",
        href: "/sobre",
        icon: Scroll,
        target: "_self",
      },
    ],
  },
  {
    label: "Calendário",
    href: "https://docs.google.com/spreadsheets/d/1FqWEWcpcRzW0r4wnsjLOIFmrwFkcqd9gnA7Lk1ZZ5uM",
    icon: Calendar,
    target: "_blank",
  },
];
