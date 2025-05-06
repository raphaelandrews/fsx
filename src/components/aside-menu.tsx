import { Link, useRouter } from "@tanstack/react-router";
import {
  BarChart2Icon,
  BookmarkIcon,
  CalendarIcon,
  CommandIcon,
  HomeIcon,
  InstagramIcon,
  type LucideIcon,
  MailIcon,
  MedalIcon,
  MegaphoneIcon,
  NewspaperIcon,
  ScrollIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";
import React from "react";

import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";

const data = {
  navMain: {
    title: "Principal",
    items: [
      {
        label: "Home",
        url: "/",
        icon: HomeIcon,
      },
      {
        label: "Notícias",
        url: "/noticias",
        icon: NewspaperIcon,
      },
      {
        label: "Ratings",
        url: "/ratings",
        icon: BarChart2Icon,
      },
    ],
  },
  highlights: {
    title: "Destaques",
    items: [
      {
        label: "Circuitos",
        url: "/circuitos",
        icon: MedalIcon,
      },
      {
        label: "Campeões",
        url: "/campeoes",
        icon: TrophyIcon,
      },
      {
        label: "Titulados",
        url: "/titulados",
        icon: BookmarkIcon,
      },
    ],
  },
  institutional: {
    title: "Institucional",
    items: [
      {
        label: "Comunicados",
        url: "/comunicados",
        icon: MegaphoneIcon,
      },
      {
        label: "Membros",
        url: "/membros",
        icon: UsersIcon,
      },
      {
        label: "Sobre",
        url: "/sobre",
        icon: ScrollIcon,
      },
    ],
  },
  navSecondary: [
    {
      label: "Calendário",
      url: "https://docs.google.com/spreadsheets/d/1FqWEWcpcRzW0r4wnsjLOIFmrwFkcqd9gnA7Lk1ZZ5uM",
      icon: CalendarIcon,
      target: false,
    },
    {
      label: "Instagram",
      url: "https://www.instagram.com/xadrezsergipe",
      icon: InstagramIcon,
      target: false,
    },
    {
      label: "Email",
      url: "mailto:fsx.presidente@gmail.com",
      icon: MailIcon,
      target: false,
    },
  ],
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
};

export function AsideMenu() {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex justify-center items-center size-7 border rounded-md">
        <CommandIcon size={16} />
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex justify-center items-center size-7 border rounded-md shrink-0 hover:bg-accent hover:text-accent-foreground hover:cursor-pointer">
        <CommandIcon size={16} />
      </SheetTrigger>
      <SheetContent className="w-[240px] h-[calc(100%-4rem)] top-11 border border-r-0 rounded-l-lg [&_#sheet-close]:hidden">
        <nav className="flex-1 overflow-auto p-2">
          <ul className="flex flex-col gap-2">
            <NavGroup data={data.navMain} onClose={() => setOpen(false)} />
            <NavGroup data={data.highlights} onClose={() => setOpen(false)} />
            <NavGroup
              data={data.institutional}
              onClose={() => setOpen(false)}
            />
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function NavGroup({
  data,
  onClose,
}: {
  data: {
    title: string;
    items: {
      label: string;
      url: string;
      icon: LucideIcon;
    }[];
  };
  onClose: () => void;
}) {
  const router = useRouter();
  const currentPath = router.state.location.pathname;

  return (
    <div>
      <div className="flex items-center font-medium text-xs text-muted-foreground h-6 px-2">
        {data.title}
      </div>
      <div className="flex flex-col gap-0.5">
        {data.items.map((item) => {
          const isActive = currentPath === item.url;
          return (
            <li key={item.label}>
              <Link
                to={item.url}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm hover:bg-accent ${
                  isActive ? "bg-accent" : ""
                }`}
                onClick={onClose}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </div>
    </div>
  );
}
