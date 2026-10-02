import { Button } from "@fsx/ui/components/button";
import { useRouter } from "@tanstack/react-router";

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
        className="mt-2 rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm hover:bg-primary/90"
      >
        Voltar ao início
      </a>
    </CenteredState>
  );
}

export function ErrorFallback({
  homeHref = "/",
  homeLabel = "Voltar ao início",
}: {
  homeHref?: string;
  homeLabel?: string;
}) {
  const router = useRouter();

  return (
    <CenteredState>
      <h1 className="font-bold text-4xl">500</h1>
      <p className="text-muted-foreground">Algo deu errado. Tente novamente mais tarde.</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button onClick={() => void router.invalidate()}>Tentar novamente</Button>
        <a
          href={homeHref}
          className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium outline-offset-2 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-ring"
        >
          {homeLabel}
        </a>
      </div>
    </CenteredState>
  );
}
