import { HugeiconsIcon } from "@hugeicons/react"
import { GithubIcon, InstagramIcon, Mail01Icon } from "@hugeicons/core-free-icons"
import { Link } from "@tanstack/react-router"

import { Logo } from "@/components/logo"

import { cn } from "@fsx/ui/lib/utils"

interface FooterLink {
  label: string
  to: string
}

interface FooterColumnProps {
  title: string
  links: FooterLink[]
}

const competitionsLinks: FooterLink[] = [
  { label: "Campeões", to: "/campeoes" },
  { label: "Circuitos", to: "/circuitos" },
  { label: "Comunicados", to: "/comunicados" },
]

const ratingLinks: FooterLink[] = [
  { label: "Ratings", to: "/ratings" },
  { label: "Membros", to: "/membros" },
  { label: "Titulados", to: "/titulados" },
]

const institutionalLinks: FooterLink[] = [
  { label: "Sobre", to: "/sobre" },
  { label: "Notícias", to: "/noticias" },
  { label: "Normas Técnicas", to: "/normas-tecnicas" },
]

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn("bg-background text-foreground", className)}>
      <div className="container max-w-7xl px-3 sm:px-8">
        <nav
          aria-label="Rodapé"
          className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-3 sm:gap-12 lg:gap-16 lg:py-14"
        >
          <FooterColumn links={competitionsLinks} title="Competições" />
          <FooterColumn links={ratingLinks} title="Rating &amp; Jogadores" />
          <FooterColumn
            links={institutionalLinks}
            title="Institucional"
          />
        </nav>

        <div className="flex items-center justify-center py-10 sm:py-12">
          <Link
            aria-label="FSX — Página inicial"
            className="text-foreground transition-opacity hover:opacity-80"
            to="/"
          >
            <Logo className="h-12 w-auto sm:h-14" />
          </Link>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container max-w-7xl px-3 sm:px-8">
          <div className="flex flex-col items-center gap-3 py-5 sm:flex-row sm:justify-between sm:gap-8">
            <div className="flex items-center gap-2">
              <a
                aria-label="Instagram da FSX (@xadrezsergipe)"
                className="inline-flex text-muted-foreground transition-all duration-300 hover:-translate-y-1 hover:text-primary"
                href="https://www.instagram.com/xadrezsergipe/"
                rel="noreferrer"
                target="_blank"
              >
                <HugeiconsIcon
                  className="size-6"
                  icon={InstagramIcon}
                  strokeWidth={2}
                />
              </a>
              <a
                aria-label="Enviar e-mail para a FSX"
                className="inline-flex text-muted-foreground transition-all duration-300 hover:-translate-y-1 hover:text-primary"
                href="mailto:fsx.presidente@gmail.com"
              >
                <HugeiconsIcon
                  className="size-6"
                  icon={Mail01Icon}
                  strokeWidth={2}
                />
              </a>
            </div>

            <p className="flex items-center gap-1 text-xs text-muted-foreground sm:text-sm">
              Built by{" "}
              <a
                aria-label="Site do Andrews (raphaelandrews)"
                className="font-medium hover:text-primary"
                href="https://andrews.sh/"
                rel="noreferrer"
                target="_blank"
              >
                Andrews
              </a>
              {" · "}
              <a
                aria-label="Código-fonte da FSX no GitHub"
                className="inline-flex items-center gap-1 font-medium hover:text-primary"
                href="https://github.com/raphaelandrews/fsx"
                rel="noreferrer"
                target="_blank"
              >
                Source code
                <HugeiconsIcon
                  className="size-3.5"
                  icon={GithubIcon}
                  strokeWidth={2}
                />
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              className="text-base font-semibold text-muted-foreground transition-colors duration-200 hover:text-primary"
              to={link.to}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
