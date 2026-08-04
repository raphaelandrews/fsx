import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="container mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-16">
      <h1 className="mb-2 font-bold text-4xl">404</h1>
      <p className="mb-6 text-muted-foreground">Página não encontrada</p>
      <a
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm hover:bg-primary/90"
      >
        Voltar ao início
      </a>
    </div>
  );
}
