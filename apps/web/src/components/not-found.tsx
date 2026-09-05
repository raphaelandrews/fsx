import { Button } from "@fsx/ui/components/button";

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
  return (
    <CenteredState>
      <h1 className="font-bold text-4xl">500</h1>
      <p className="text-muted-foreground">Algo deu errado. Tente novamente mais tarde.</p>
      <a href={homeHref} className="mt-2">
        <Button>{homeLabel}</Button>
      </a>
    </CenteredState>
  );
}
