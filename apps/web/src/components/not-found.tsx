import { Button, buttonVariants } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";
import { useRouter } from "@tanstack/react-router";

import { getErrorCode, getUserErrorMessage, type Locale } from "@/lib/errors";

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-2 px-4 text-center">
      {children}
    </div>
  );
}

export function NotFound() {
  return (
    <CenteredState>
      <h1 className="font-bold text-4xl">404</h1>
      <p className="text-muted-foreground">Página não encontrada</p>
      <a
        href="/"
        className={cn(buttonVariants({ size: "pill" }), "mt-4 active:scale-[0.96]")}
      >
        Voltar ao início
      </a>
    </CenteredState>
  );
}

const ERROR_TEXT = {
  pt: { retry: "Tentar novamente", home: "Voltar ao início", fallback: "Algo deu errado. Tente novamente mais tarde.", signIn: "Entrar" },
  en: { retry: "Try again", home: "Back to home", fallback: "Something went wrong. Try again later.", signIn: "Sign in" },
};

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
  const needsSignIn = code === "UNAUTHORIZED";
  const retryable = code !== "FORBIDDEN" && !needsSignIn;
  const message = code ? getUserErrorMessage(error, text.fallback, locale) : text.fallback;

  return (
    <CenteredState>
      <h1 className="font-bold text-4xl">{code === "FORBIDDEN" ? "403" : needsSignIn ? "401" : code === "TOO_MANY_REQUESTS" ? "429" : "500"}</h1>
      <p className="max-w-md text-muted-foreground">{message}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {retryable ? (
          <Button size="pill" onClick={() => void router.invalidate()}>
            {text.retry}
          </Button>
        ) : null}
        {needsSignIn ? (
          <a href="/login" className={cn(buttonVariants({ size: "pill" }), "active:scale-[0.96]")}>
            {text.signIn}
          </a>
        ) : null}
        <a
          href={homeHref}
          className={cn(buttonVariants({ variant: "outline", size: "pill" }), "active:scale-[0.96]")}
        >
          {homeLabel ?? text.home}
        </a>
      </div>
    </CenteredState>
  );
}
