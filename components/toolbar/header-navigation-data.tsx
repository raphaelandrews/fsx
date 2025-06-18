import {
  BarChart2Icon,
  BookmarkIcon,
  MedalIcon,
  MegaphoneIcon,
  NewspaperIcon,
  ScrollIcon,
  TrophyIcon,
} from "lucide-react";
import {
  CalendarDaysAnimated,
  FileTextAnimated,
  HomeAnimated,
  LinkAnimated,
  SparklesAnimated,
  UsersAnimated,
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
    icon: HomeAnimated,
    target: "_self",
  },
  {
    label: "Destaques",
    href: "#",
    icon: SparklesAnimated,
    target: "_self",
    items: [
      {
        label: "Notícias",
        description: "Acesse as informações mais recentes da FSX.",
        href: "/noticias",
        icon: NewspaperIcon,
        target: "_self",
      },
      {
        label: "Rating",
        description: "Confira as tabelas de rating.",
        href: "/ratings",
        icon: BarChart2Icon,
        target: "_self",
      },
      {
        label: "Circuitos",
        description:
          "Confira a classificação dos circuitos de Xadrez de Sergipe.",
        href: "/circuitos",
        icon: MedalIcon,
        target: "_self",
      },
      {
        label: "Comunicados",
        description: "Divulgação de titulações e outras informações.",
        href: "/comunicados",
        icon: MegaphoneIcon,
        target: "_self",
      },
    ],
  },
  {
    label: "Institucional",
    href: "##",
    icon: FileTextAnimated,
    target: "_self",
    items: [
      {
        label: "Campeões",
        description: "Galeria dos campeões e campeãs Sergipanos.",
        href: "/campeoes",
        icon: TrophyIcon,
        target: "_self",
      },
      {
        label: "Titulados",
        description: "Jogadores titulados da FSX.",
        href: "/titulados",
        icon: BookmarkIcon,
        target: "_self",
      },
      {
        label: "Membros",
        description: "Diretoria e árbitros da FSX.",
        href: "/membros",
        icon: UsersAnimated,
        target: "_self",
      },
      {
        label: "Sobre",
        description: "Normas técnicas, documentos e história da FSX.",
        href: "/sobre",
        icon: ScrollIcon,
        target: "_self",
      },
    ],
  },
  {
    label: "Calendário",
    href: "https://docs.google.com/spreadsheets/d/1FqWEWcpcRzW0r4wnsjLOIFmrwFkcqd9gnA7Lk1ZZ5uM",
    icon: CalendarDaysAnimated,
    target: "_blank",
  },
  {
    label: "Links",
    href: "/links",
    icon: LinkAnimated,
    target: "_blank",
  },
];
