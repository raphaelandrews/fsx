import { HugeiconsIcon } from "@hugeicons/react"
import {
  GithubIcon,
  InstagramIcon,
  Mail01Icon,
} from "@hugeicons/core-free-icons"
import { Link } from "@tanstack/react-router"

import { Logo } from "@/components/logo"

import { cn } from "@fsx/ui/lib/utils"

const footerLinks = [
  { label: "Home", to: "/" },
  { label: "Notícias", to: "/noticias" },
  { label: "Rating", to: "/ratings" },
  { label: "Campeões", to: "/campeoes" },
  { label: "Circuitos", to: "/circuitos" },
  { label: "Comunicados", to: "/comunicados" },
  { label: "Membros", to: "/membros" },
  { label: "Titulados", to: "/titulados" },
  { label: "Sobre", to: "/sobre" },
]

const socials = [
  {
    label: "Instagram da FSX (@xadrezsergipe)",
    href: "https://www.instagram.com/xadrezsergipe/",
    icon: InstagramIcon,
  },
  {
    label: "Código-fonte da FSX no GitHub",
    href: "https://github.com/raphaelandrews/fsx",
    icon: GithubIcon,
  },
  {
    label: "Enviar e-mail para a FSX",
    href: "mailto:fsx.presidente@gmail.com",
    icon: Mail01Icon,
  },
]

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("bg-background text-foreground", className)}>
      <div className="container flex max-w-7xl flex-col items-center gap-8 px-3 py-14 sm:px-8">
        <Link
          aria-label="FSX — Página inicial"
          className="text-foreground transition-colors hover:text-primary"
          to="/"
        >
          <Logo className="h-6 w-auto" />
        </Link>

        <img
          alt=""
          aria-hidden="true"
          className="h-4 w-auto rounded-xs"
          loading="lazy"
          src="/sergipe_flag.svg"
        />

        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-5 text-muted-foreground">
            {socials.map(({ label, href, icon }) => (
              <a
                key={href}
                aria-label={label}
                className="inline-flex transition-all duration-300 hover:-translate-y-1 hover:text-primary"
                href={href}
                rel="noreferrer"
                target={href.startsWith("mailto:") ? undefined : "_blank"}
              >
                <HugeiconsIcon
                  className="size-6"
                  icon={icon}
                  strokeWidth={2}
                />
              </a>
            ))}
          </div>

          <nav
            aria-label="Rodapé"
            className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
          >
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                to={link.to}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="text-balance text-center text-muted-foreground text-sm leading-loose">
            Built by 📟{" "}
            <a
              className="font-medium text-bulbasaur-foreground transition duration-200 hover:text-highlight"
              href="https://andrews.sh/"
              rel="noreferrer"
              target="_blank"
            >
              Andrews
            </a>
            .{" "}
            <a
              className="font-medium transition duration-200 hover:text-highlight"
              href="https://github.com/raphaelandrews/fsx"
              rel="noreferrer"
              target="_blank"
            >
              Source code
            </a>
            .
          </div>
        </div>
      </div>
    </footer>
  )
}

