import { useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation, useRouter, type LinkProps } from "@tanstack/react-router";

import { Button, buttonVariants } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

import { getErrorCode, getUserErrorMessage, isAdminPath, type Locale } from "@/lib/errors";

function CenteredState({ code, title, children }: { code: string; title: string; children: ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null);
  // Keyboard and screen reader users land on the message, not on whatever was focused before.
  useEffect(() => heading.current?.focus({ preventScroll: true }), []);

  return (
    <div className="flex w-full flex-col items-center gap-2 px-4 py-20 text-center sm:py-28">
      <p className="font-semibold text-muted-foreground tabular-nums">{code}</p>
      <h1 ref={heading} tabIndex={-1} className="text-balance font-bold text-3xl outline-none sm:text-4xl">
        {title}
      </h1>
      {children}
    </div>
  );
}

const asRoute = (path: string) => path as LinkProps["to"];
const primaryLink = cn(buttonVariants({ size: "pill" }), "active:scale-[0.96]");
const secondaryLink = cn(buttonVariants({ variant: "outline", size: "pill" }), "active:scale-[0.96]");

// What the visitor was probably looking for, from the first segment of the address.
const PUBLIC_SECTIONS: Record<string, { noun: string; list: string; label: string }> = {
  jogadores: { noun: "este jogador", list: "/ratings", label: "Ver ratings" },
  noticias: { noun: "esta notícia", list: "/noticias", label: "Ver notícias" },
  comunicados: { noun: "este comunicado", list: "/comunicados", label: "Ver comunicados" },
  clubes: { noun: "este clube", list: "/clubes", label: "Ver clubes" },
  circuitos: { noun: "este circuito", list: "/circuitos", label: "Ver circuitos" },
  campeoes: { noun: "esta página", list: "/campeoes", label: "Ver campeões" },
};

const QUICK_LINKS = [
  { to: "/ratings", label: "Ratings" },
  { to: "/noticias", label: "Notícias" },
  { to: "/campeoes", label: "Campeões" },
  { to: "/clubes", label: "Clubes" },
] as const;

function AdminNotFound({ pathname }: { pathname: string }) {
  const [, section] = pathname.split("/").filter(Boolean);
  const hasList = pathname.startsWith("/dashboard/") && section;
  return (
    <CenteredState code="404" title="Not found">
      <p className="max-w-md text-muted-foreground">
        This page or record does not exist. It may have been deleted, or the address is wrong.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {hasList ? (
          <Link to={asRoute(`/dashboard/${section}`)} className={primaryLink}>
            Back to {section.replace(/-/g, " ")}
          </Link>
        ) : null}
        <Link to="/dashboard" className={hasList ? secondaryLink : primaryLink}>
          Dashboard
        </Link>
      </div>
    </CenteredState>
  );
}

export function NotFound() {
  const { pathname } = useLocation();
  if (isAdminPath(pathname)) return <AdminNotFound pathname={pathname} />;

  const [first, second] = pathname.split("/").filter(Boolean);
  const section = first ? PUBLIC_SECTIONS[first] : undefined;
  return (
    <CenteredState code="404" title="Página não encontrada">
      <p className="max-w-md text-pretty text-muted-foreground">
        {section && second
          ? `Não encontramos ${section.noun}. Ele pode ter sido removido ou o endereço está incorreto.`
          : "O endereço não existe ou foi movido."}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Link to="/" className={primaryLink}>
          Voltar ao início
        </Link>
        {section ? (
          <Link to={asRoute(section.list)} className={secondaryLink}>
            {section.label}
          </Link>
        ) : null}
      </div>
      <nav aria-label="Seções do site" className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-muted-foreground">
        {QUICK_LINKS.filter((link) => link.to !== section?.list).map((link) => (
          <Link key={link.to} to={link.to} className="transition-colors hover:text-foreground">
            {link.label}
          </Link>
        ))}
      </nav>
    </CenteredState>
  );
}

const ERROR_TEXT = {
  pt: {
    retry: "Tentar novamente",
    home: "Voltar ao início",
    reload: "Recarregar a página",
    signIn: "Entrar",
    fallback: "Algo deu errado. Tente novamente mais tarde.",
    updatedTitle: "O site foi atualizado",
    updated: "Há uma versão nova do site. Recarregue a página para continuar.",
  },
  en: {
    retry: "Try again",
    home: "Back to home",
    reload: "Reload the page",
    signIn: "Sign in",
    fallback: "Something went wrong. Try again later.",
    updatedTitle: "The site was updated",
    updated: "A new version is available. Reload the page to continue.",
  },
};

const TITLES: Record<string, Record<Locale, string>> = {
  FORBIDDEN: { pt: "Acesso negado", en: "Access denied" },
  UNAUTHORIZED: { pt: "Sessão necessária", en: "Sign-in required" },
  TOO_MANY_REQUESTS: { pt: "Muitas tentativas", en: "Too many requests" },
};
const CODES: Record<string, string> = { FORBIDDEN: "403", UNAUTHORIZED: "401", TOO_MANY_REQUESTS: "429" };
const DEFAULT_TITLE: Record<Locale, string> = { pt: "Algo deu errado", en: "Something went wrong" };

// After a deploy, a tab that is still open asks for script files that no longer exist.
const STALE_BUNDLE = /dynamically imported module|importing a module script failed|ChunkLoadError|Unable to preload CSS/i;
const isStaleBundle = (error: unknown) => error instanceof Error && STALE_BUNDLE.test(error.message);

export function ErrorFallback({
  error,
  locale = "pt",
  homeHref = "/",
  homeLabel,
}: {
  error?: unknown;
  locale?: Locale;
  homeHref?: string;
  homeLabel?: string;
}) {
  const router = useRouter();
  const text = ERROR_TEXT[locale];
  const code = getErrorCode(error);
  const stale = isStaleBundle(error);
  const needsSignIn = code === "UNAUTHORIZED";
  const retryable = !stale && code !== "FORBIDDEN" && !needsSignIn;

  const title = stale ? text.updatedTitle : ((code && TITLES[code]?.[locale]) ?? DEFAULT_TITLE[locale]);
  const message = stale ? text.updated : code ? getUserErrorMessage(error, text.fallback, locale) : text.fallback;

  return (
    <CenteredState code={stale ? "↻" : (code && CODES[code]) || "500"} title={title}>
      <p className="max-w-md text-pretty text-muted-foreground">{message}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {stale ? (
          <Button size="pill" onClick={() => window.location.reload()}>
            {text.reload}
          </Button>
        ) : null}
        {retryable ? (
          <Button size="pill" onClick={() => void router.invalidate()}>
            {text.retry}
          </Button>
        ) : null}
        {needsSignIn ? (
          <a href="/login" className={primaryLink}>
            {text.signIn}
          </a>
        ) : null}
        {/* A full page load on purpose: it clears whatever state caused the error. */}
        <a href={homeHref} className={stale ? secondaryLink : cn(buttonVariants({ variant: "outline", size: "pill" }), "active:scale-[0.96]")}>
          {homeLabel ?? text.home}
        </a>
      </div>
    </CenteredState>
  );
}
