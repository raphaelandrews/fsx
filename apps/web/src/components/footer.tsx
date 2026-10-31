import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/logo";
import { SocialLinks } from "@/components/social-links";

import { cn } from "@fsx/ui/lib/utils";

const footerLinks = [
  { label: "Início", to: "/" },
  { label: "Notícias", to: "/noticias" },
  { label: "Rating", to: "/ratings" },
  { label: "Calendário", to: "/calendario" },
  { label: "Sobre", to: "/sobre" },
];

export function Footer({ className, showNav = true }: { className?: string; showNav?: boolean }) {
  return (
    <footer className={cn("bg-background text-base font-semibold text-foreground", className)}>
      <div className="container flex max-w-7xl flex-col items-center gap-8 px-3 py-14 sm:px-8">
        <Link aria-label="FSX — Página inicial" className="-m-3 p-3 text-foreground" to="/">
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
          <SocialLinks className="flex items-center gap-3" />

          {showNav ? (
            <nav
              aria-label="Rodapé"
              className="flex flex-wrap items-center justify-center gap-x-5"
            >
              {footerLinks.map((link) => (
                <Link
                  key={link.to}
                  className="py-2 text-base text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                  to={link.to}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}

          <div className="text-balance text-center text-muted-foreground text-base leading-loose">
            Built by 📟{" "}
            <a
              className="underline-reveal text-primary transition-colors duration-150 hover:text-link-hover"
              href="https://andrews.sh/"
              rel="noreferrer"
              target="_blank"
            >
              Raphael
            </a>
            .{" "}
            <a
              className="underline-reveal text-foreground transition-colors duration-150 hover:text-link-hover"
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
  );
}
