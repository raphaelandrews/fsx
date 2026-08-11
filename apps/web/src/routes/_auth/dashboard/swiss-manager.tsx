import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/swiss-manager")({
  head: () => ({ title: "Swiss Manager - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();

  const { data: players = [] } = useSuspenseQuery(trpc.swissManager.list.queryOptions());

  const exportCSV = () => {
    const headers = ["Nome", "Sexo", "Nascimento", "Clube", "Classico", "Rapido", "Blitz"];
    const rows = players.map((p) => [
      p.name,
      p.sex ? "F" : "M",
      p.birth ?? "",
      p.club?.name ?? "",
      String(p.classic),
      String(p.rapid),
      String(p.blitz),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "swiss-manager-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Swiss Manager Export</h1>
        <Button onClick={exportCSV}>Download CSV</Button>
      </div>
      <p className="mb-4 text-muted-foreground text-sm">
        Export player data for Swiss Manager. Contains {players.length} players.
      </p>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-center">Sex</th>
              <th className="px-4 py-2 text-left">Birth</th>
              <th className="px-4 py-2 text-left">Club</th>
              <th className="px-4 py-2 text-right">Classic</th>
              <th className="px-4 py-2 text-right">Rapid</th>
              <th className="px-4 py-2 text-right">Blitz</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2 text-center">{p.sex === "female" ? "F" : "M"}</td>
                <td className="px-4 py-2">{p.birth}</td>
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
