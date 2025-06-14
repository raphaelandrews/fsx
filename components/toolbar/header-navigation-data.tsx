import {
  HomeIcon,
  SparklesIcon,
  CalendarDaysIcon,
  FileTextIcon,
} from "@/components/animated-icons";

type NavigationItem = {
  label: string;
  href: string;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<{ size?: number; className?: string }> &
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      React.RefAttributes<any>
  >;
  description?: string;
  target: string;
  items?: NavigationItem[];
};

export const navigationItems: NavigationItem[] = [
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
        description: "Acesse as informações mais recentes da FSX.",
        href: "/noticias",
        icon: HomeIcon,
        target: "_self",
      },
      {
        label: "Rating",
        description: "Confira as tabelas de rating.",
        href: "/ratings",
        icon: FileTextIcon,
        target: "_self",
      },
      {
        label: "Circuitos",
        description:
          "Confira a classificação dos circuitos de Xadrez de Sergipe.",
        href: "/circuitos",
        icon: HomeIcon,
        target: "_self",
      },
      {
        label: "Comunicados",
        description: "Divulgação de titulações e outras informações.",
        href: "/comunicados",
        icon: HomeIcon,
        target: "_self",
      },
    ],
  },
  {
    label: "Institucional",
    href: "##",
    icon: FileTextIcon,
    target: "_self",
    items: [
      {
        label: "Campeões",
        description: "Galeria dos campeões e campeãs Sergipanos.",
        href: "/campeoes",
        icon: HomeIcon,
        target: "_self",
      },
      {
        label: "Titulados",
        description: "Jogadores titulados da FSX.",
        href: "/titulados",
        icon: HomeIcon,
        target: "_self",
      },
      {
        label: "Membros",
        description: "Diretoria e árbitros da FSX.",
        href: "/membros",
        icon: HomeIcon,
        target: "_self",
      },
      {
        label: "Sobre",
        description: "Normas técnicas, documentos e história da FSX.",
        href: "/sobre",
        icon: HomeIcon,
        target: "_self",
      },
    ],
  },
  {
    label: "Calendário",
    href: "https://docs.google.com/spreadsheets/d/1FqWEWcpcRzW0r4wnsjLOIFmrwFkcqd9gnA7Lk1ZZ5uM",
    icon: CalendarDaysIcon,
    target: "_blank",
  },
];
