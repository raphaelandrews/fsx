import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fsx/ui/components/table";

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Swiss Manager</h1>
        <Button onClick={exportCSV}>Download CSV</Button>
      </div>
      <p className="mb-4 text-muted-foreground text-sm">
        Exporte dados de {players.length} jogadores para importação no Swiss Manager.
      </p>
      <div className="overflow-hidden rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="text-center">Sexo</TableHead>
              <TableHead>Nascimento</TableHead>
              <TableHead>Clube</TableHead>
              <TableHead className="text-right">Clássico</TableHead>
              <TableHead className="text-right">Rápido</TableHead>
              <TableHead className="text-right">Blitz</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell className="text-center">{p.sex === "female" ? "F" : "M"}</TableCell>
                <TableCell>{p.birthDate}</TableCell>
                <TableCell>{p.club?.name}</TableCell>
                <TableCell className="text-right tabular-nums">{p.classic}</TableCell>
                <TableCell className="text-right tabular-nums">{p.rapid}</TableCell>
                <TableCell className="text-right tabular-nums">{p.blitz}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
