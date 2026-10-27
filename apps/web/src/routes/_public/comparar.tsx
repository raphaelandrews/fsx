import { createFileRoute, Link, stripSearchParams, useNavigate } from "@tanstack/react-router";
import { Calendar01Icon, ChartBarLineIcon, UserMultipleIcon } from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";

import { CommonTournaments, CompareStats } from "@/components/comparar/compare-table";
import { SearchableSelect } from "@/components/form/searchable-select";
import { PageHeader } from "@/components/page-header";
import { SectionHeading } from "@/components/section-heading";
import { CardGridSkeleton } from "@/components/skeletons/card-grid-skeleton";
import { orNotFound } from "@/lib/errors";
import { compareSearchSchema } from "@/lib/search-schemas";
import { buildSeo, withBrand } from "@/lib/seo";
import { useTRPC } from "@/lib/trpc";

// Naming the same player twice is not a comparison, so the second side is dropped.
const normalized = (search: { a?: number; b?: number }) => ({ a: search.a, b: search.b === search.a ? undefined : search.b });

export const Route = createFileRoute("/_public/comparar")({
  validateSearch: compareSearchSchema,
  search: { middlewares: [stripSearchParams({})] },
  loaderDeps: ({ search }) => normalized(search),
  loader: async ({ context, deps }) => {
    const { a, b } = deps;
    if (a && b) {
      return { comparison: await orNotFound(context.queryClient.ensureQueryData(context.trpc.players.compare.queryOptions({ a, b }))), lone: null };
    }
    const id = a ?? b;
    const lone = id ? await orNotFound(context.queryClient.ensureQueryData(context.trpc.players.byId.queryOptions({ id }))) : null;
    return { comparison: null, lone: lone ? { id: lone.id, name: lone.name } : null };
  },
  head: () =>
    buildSeo({
      title: withBrand("Comparar jogadores"),
      description: "Compare dois jogadores da Federação Sergipana de Xadrez: ratings, torneios, medalhas e confrontos em comum.",
      path: "/comparar",
      noindex: true,
    }),
  pendingComponent: () => <CardGridSkeleton />,
  component: RouteComponent,
});

function Picker({ id, label, value, name, onChange }: { id: string; label: string; value?: number; name?: string; onChange: (id: number | undefined) => void }) {
  const trpc = useTRPC();
  return (
    <div className="grid gap-1.5 text-sm">
      <label htmlFor={id}>{label}</label>
      <SearchableSelect
        key={`${id}-${value ?? "none"}`}
        id={id}
        value={value ? String(value) : ""}
        initialLabel={name}
        onChange={(next) => onChange(next ? Number(next) : undefined)}
        getQueryOptions={(query) => trpc.players.search.queryOptions({ query })}
        placeholder="Buscar jogador..."
        emptyText="Nenhum jogador encontrado."
      />
    </div>
  );
}

function RouteComponent() {
  const navigate = useNavigate();
  const { a, b } = normalized(Route.useSearch());
  const set = (patch: { a?: number; b?: number }) =>
    navigate({ to: "/comparar", search: { a, b, ...patch }, replace: true });

  const { comparison, lone } = Route.useLoaderData();
  const names = comparison
    ? { a: comparison.players[0]?.name, b: comparison.players[1]?.name }
    : { a: lone && lone.id === a ? lone.name : undefined, b: lone && lone.id === b ? lone.name : undefined };

  return (
    <>
      <PageHeader icon={UserMultipleIcon} title="Comparar jogadores" description="Escolha dois jogadores para ver ratings, medalhas e torneios em comum." />

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Picker id="compare-a" label="Jogador 1" value={a} name={names.a} onChange={(id) => set({ a: id })} />
        <Picker id="compare-b" label="Jogador 2" value={b} name={names.b} onChange={(id) => set({ b: id })} />
      </div>

      {comparison ? (
        <div className="grid gap-8">
          <section className="min-w-0">
            <SectionHeading icon={ChartBarLineIcon} label="Lado a lado" />
            <CompareStats players={comparison.players} />
          </section>
          <section className="min-w-0">
            <SectionHeading icon={Calendar01Icon} label="Torneios em comum" />
            <CommonTournaments comparison={comparison} />
          </section>
          <div className="flex justify-center">
            <Button variant="outline" render={<Link to="/comparar" search={{ a: b, b: a }} replace />}>
              Inverter lados
            </Button>
          </div>
        </div>
      ) : (
        <p className="py-8 text-center text-muted-foreground">Escolha {a || b ? "o segundo" : "os dois"} jogador{a || b ? "" : "es"} para comparar.</p>
      )}
    </>
  );
}
