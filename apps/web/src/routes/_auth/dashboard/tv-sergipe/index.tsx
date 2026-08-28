import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@fsx/ui/components/table";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";
import { MODALITY_LABELS, SEX_LABELS } from "./-constants";

export const Route = createFileRoute("/_auth/dashboard/tv-sergipe/")({
  head: () => ({ meta: [{ title: "TV Sergipe - Admin - FSX" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(context.trpc.tvSergipe.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const { data: results = [] } = useSuspenseQuery(trpc.tvSergipe.list.queryOptions());

  const deleteMutation = useMutation({
    ...trpc.tvSergipe.delete.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.tvSergipe.list.queryFilter()); toast.success("Result deleted"); },
    onError: () => toast.error("Failed to delete result"),
  });

  const deleteAllMutation = useMutation({
    ...trpc.tvSergipe.deleteAll.mutationOptions(),
    onSuccess: () => { qc.invalidateQueries(trpc.tvSergipe.list.queryFilter()); toast.success("All results deleted"); },
    onError: () => toast.error("Failed to delete all results"),
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">TV Sergipe</h1>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={() => { if (window.confirm("Delete all school results? This cannot be undone.")) deleteAllMutation.mutate(); }}>Delete All Results</Button>
          <Link to="/dashboard/tv-sergipe/create"><Button>Create Result</Button></Link>
        </div>
      </div>
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Escola</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Modalidade</TableHead>
              <TableHead>Equipe</TableHead>
              <TableHead>Jogador</TableHead>
              <TableHead>Lugar</TableHead>
              <TableHead>Pontos</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.club?.name}</TableCell>
                <TableCell>{r.ageGroup}</TableCell>
                <TableCell>{SEX_LABELS[r.sex as "male" | "female"]}</TableCell>
                <TableCell>{MODALITY_LABELS[r.modality as "individual" | "team"]}</TableCell>
                <TableCell>{r.teamName ?? "—"}</TableCell>
                <TableCell>{r.player?.name ?? "—"}</TableCell>
                <TableCell>{r.place}</TableCell>
                <TableCell>{r.points}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Link to="/dashboard/tv-sergipe/$id" params={{ id: String(r.id) }}><Button size="sm" variant="outline">Edit</Button></Link>
                    <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate({ id: r.id })}>Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}