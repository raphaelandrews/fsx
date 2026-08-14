import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/swiss-manager")({
  head: () => ({
    meta: [
      { title: "Swiss Manager - FSX" },
      { name: "description", content: "Exporte dados de jogadores para o Swiss Manager." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.swissManager.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();

  const { data: players = [] } = useSuspenseQuery(trpc.swissManager.list.queryOptions());

  const exportCSV = () => {
    const headers = ["Nome", "Sexo", "Nascimento", "Clube", "Classico", "Rapido", "Blitz"];
    const rows = players.map((p) => [
      p.name,
      p.sex === "female" ? "F" : "M",
      p.birthDate ?? "",
      p.club?.name ?? "",
      String(p.classic),
      String(p.rapid),
      String(p.blitz),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "swiss-manager-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Swiss Manager</h1>
        <Button onClick={exportCSV}>Download CSV</Button>
      </div>
      <p className="mb-4 text-muted-foreground text-sm">
        Exporte dados de {players.length} jogadores para importação no Swiss Manager.
      </p>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-center">Sexo</th>
              <th className="px-4 py-2 text-left">Nascimento</th>
              <th className="px-4 py-2 text-left">Clube</th>
              <th className="px-4 py-2 text-right">Clássico</th>
              <th className="px-4 py-2 text-right">Rápido</th>
              <th className="px-4 py-2 text-right">Blitz</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2 text-center">{p.sex === "female" ? "F" : "M"}</td>
                <td className="px-4 py-2">{p.birthDate}</td>
                <td className="px-4 py-2">{p.club?.name}</td>
                <td className="px-4 py-2 text-right">{p.classic}</td>
                <td className="px-4 py-2 text-right">{p.rapid}</td>
                <td className="px-4 py-2 text-right">{p.blitz}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
