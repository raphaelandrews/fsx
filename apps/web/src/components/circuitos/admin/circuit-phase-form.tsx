import { HugeiconsIcon } from "@hugeicons/react";
import { Delete03Icon } from "@hugeicons/core-free-icons";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";

import { SearchableSelect } from "@/components/searchable-select";
import { useTRPC } from "@/utils/trpc";

import type { CircuitPhase } from "../types";
import { useInvalidateCircuit } from "./use-invalidate-circuit";

const phaseSchema = z.object({
  tournamentId: z.string().min(1, "Torneio é obrigatório"),
  clubId: z.string(),
  sortOrder: z.number().int(),
});

export function CircuitPhaseForm({
  circuitId,
  phase,
  nextSortOrder = 0,
}: {
  circuitId: number;
  phase?: CircuitPhase;
  nextSortOrder?: number;
}) {
  const trpc = useTRPC();
  const invalidate = useInvalidateCircuit();

  const createMutation = useMutation({
    ...trpc.circuits.phases.create.mutationOptions(),
    onSuccess: () => {
      invalidate();
      toast.success("Etapa adicionada");
    },
    onError: () => toast.error("Falha ao adicionar etapa"),
  });

  const updateMutation = useMutation({
    ...trpc.circuits.phases.update.mutationOptions(),
    onSuccess: () => {
      invalidate();
      toast.success("Etapa atualizada");
    },
    onError: () => toast.error("Falha ao atualizar etapa"),
  });

  const deleteMutation = useMutation({
    ...trpc.circuits.phases.delete.mutationOptions(),
    onSuccess: () => {
      invalidate();
      toast.success("Etapa removida");
    },
    onError: () => toast.error("Falha ao remover etapa"),
  });

  const isPending = phase ? updateMutation.isPending : createMutation.isPending;

  const form = useForm({
    defaultValues: {
      tournamentId: phase ? String(phase.tournamentId) : "",
      clubId: phase?.clubId ? String(phase.clubId) : "",
      sortOrder: phase ? phase.sortOrder : nextSortOrder,
    },
    validators: { onSubmit: phaseSchema },
    onSubmit: ({ value }) => {
      const payload = {
        tournamentId: Number(value.tournamentId),
        clubId: value.clubId ? Number(value.clubId) : null,
        sortOrder: value.sortOrder,
      };
      if (phase) {
        updateMutation.mutate({ id: phase.id, ...payload });
      } else {
        createMutation.mutate({ circuitId, ...payload });
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/20 p-3"
    >
      <form.Field name="tournamentId">
        {(f) => (
          <div className="flex min-w-[220px] flex-1 flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Torneio</Label>
            <SearchableSelect
              value={f.state.value}
              onChange={(v) => f.handleChange(v)}
              getQueryOptions={(q) => trpc.tournaments.search.queryOptions({ query: q })}
              placeholder="Buscar torneio..."
              emptyText="Nenhum torneio encontrado."
              initialLabel={phase?.tournament?.name ?? ""}
            />
            {f.state.meta.errors.map((e) => (
              <p key={e?.message} className="text-destructive text-xs">
                {e?.message}
              </p>
            ))}
          </div>
        )}
      </form.Field>
      <form.Field name="clubId">
        {(f) => (
          <div className="flex min-w-[180px] flex-1 flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Clube sede (opcional)</Label>
            <SearchableSelect
              value={f.state.value}
              onChange={(v) => f.handleChange(v)}
              getQueryOptions={(q) => trpc.clubs.search.queryOptions({ query: q })}
              placeholder="Buscar clube..."
              emptyText="Nenhum clube encontrado."
              initialLabel={phase?.club?.name ?? ""}
            />
          </div>
        )}
      </form.Field>
      <form.Field name="sortOrder">
        {(f) => (
          <div className="flex w-20 flex-col gap-1">
            <Label htmlFor={f.name} className="text-xs text-muted-foreground">
              Ordem
            </Label>
            <Input
              id={f.name}
              type="number"
              value={String(f.state.value)}
              onBlur={f.handleBlur}
              onChange={(e) => f.handleChange(Number(e.target.value))}
            />
          </div>
        )}
      </form.Field>
      <div className="flex items-center gap-1">
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit })}>
          {({ canSubmit }) => (
            <Button type="submit" variant="outline" size="sm" disabled={!canSubmit || isPending}>
              {phase ? "Salvar" : "Adicionar etapa"}
            </Button>
          )}
        </form.Subscribe>
        {phase ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Excluir etapa"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate({ id: phase.id })}
          >
            <HugeiconsIcon
              className="size-4 text-destructive"
              icon={Delete03Icon}
              strokeWidth={2}
            />
          </Button>
        ) : null}
      </div>
    </form>
  );
}
