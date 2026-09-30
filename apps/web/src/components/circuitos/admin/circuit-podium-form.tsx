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

import type { CircuitPodium } from "../types";
import { useInvalidateCircuit } from "./use-invalidate-circuit";

export type PodiumTarget = { circuitId?: number; circuitPhaseId?: number };

const podiumSchema = z.object({
  playerId: z.string().min(1, "Jogador é obrigatório"),
  category: z.string(),
  place: z
    .string()
    .refine((v) => v.trim() === "" || Number.isInteger(Number(v)), "Colocação inválida"),
  points: z.string().refine((v) => v.trim() !== "" && !Number.isNaN(Number(v)), "Pontos inválidos"),
});

export function CircuitPodiumForm({
  target,
  podium,
}: {
  target: PodiumTarget;
  podium?: CircuitPodium;
}) {
  const trpc = useTRPC();
  const invalidate = useInvalidateCircuit();

  const createMutation = useMutation({
    ...trpc.circuits.podiums.create.mutationOptions(),
    onSuccess: () => {
      invalidate();
      toast.success("Pódio adicionado");
    },
    onError: () => toast.error("Falha ao adicionar pódio"),
  });

  const updateMutation = useMutation({
    ...trpc.circuits.podiums.update.mutationOptions(),
    onSuccess: () => {
      invalidate();
      toast.success("Pódio atualizado");
    },
    onError: () => toast.error("Falha ao atualizar pódio"),
  });

  const deleteMutation = useMutation({
    ...trpc.circuits.podiums.delete.mutationOptions(),
    onSuccess: () => {
      invalidate();
      toast.success("Pódio removido");
    },
    onError: () => toast.error("Falha ao remover pódio"),
  });

  const isPending = podium ? updateMutation.isPending : createMutation.isPending;

  const form = useForm({
    defaultValues: {
      playerId: podium ? String(podium.playerId) : "",
      category: podium?.category ?? "",
      place: podium?.place != null ? String(podium.place) : "",
      points: podium ? String(podium.points) : "",
    },
    validators: { onSubmit: podiumSchema },
    onSubmit: ({ value }) => {
      const payload = {
        playerId: Number(value.playerId),
        circuitId: target.circuitId ?? null,
        circuitPhaseId: target.circuitPhaseId ?? null,
        category: value.category.trim() || null,
        place: value.place.trim() ? Number(value.place) : null,
        points: Number(value.points),
      };
      if (podium) {
        updateMutation.mutate({ id: podium.id, ...payload });
      } else {
        createMutation.mutate(payload);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
    >
      <form.Field name="playerId">
        {(f) => (
          <div className="flex min-w-[200px] flex-1 flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Jogador</Label>
            <SearchableSelect
              value={f.state.value}
              onChange={(v) => f.handleChange(v)}
              getQueryOptions={(q) => trpc.players.search.queryOptions({ query: q })}
              placeholder="Buscar jogador..."
              emptyText="Nenhum jogador encontrado."
              initialLabel={podium?.player?.name ?? ""}
            />
            {f.state.meta.errors.map((e) => (
              <p key={e?.message} className="text-destructive text-xs">
                {e?.message}
              </p>
            ))}
          </div>
        )}
      </form.Field>
      <form.Field name="category">
        {(f) => (
          <div className="flex w-28 flex-col gap-1">
            <Label htmlFor={f.name} className="text-xs text-muted-foreground">
              Categoria
            </Label>
            <Input
              id={f.name}
              value={f.state.value}
              onBlur={f.handleBlur}
              onChange={(e) => f.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>
      <form.Field name="place">
        {(f) => (
          <div className="flex w-20 flex-col gap-1">
            <Label htmlFor={f.name} className="text-xs text-muted-foreground">
              Lugar
            </Label>
            <Input
              id={f.name}
              type="number"
              value={f.state.value}
              onBlur={f.handleBlur}
              onChange={(e) => f.handleChange(e.target.value)}
            />
            {f.state.meta.errors.map((e) => (
              <p key={e?.message} className="text-destructive text-xs">
                {e?.message}
              </p>
            ))}
          </div>
        )}
      </form.Field>
      <form.Field name="points">
        {(f) => (
          <div className="flex w-24 flex-col gap-1">
            <Label htmlFor={f.name} className="text-xs text-muted-foreground">
              Pontos
            </Label>
            <Input
              id={f.name}
              type="number"
              step="any"
              value={f.state.value}
              onBlur={f.handleBlur}
              onChange={(e) => f.handleChange(e.target.value)}
            />
            {f.state.meta.errors.map((e) => (
              <p key={e?.message} className="text-destructive text-xs">
                {e?.message}
              </p>
            ))}
          </div>
        )}
      </form.Field>
      <div className="flex items-center gap-1">
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit })}>
          {({ canSubmit }) => (
            <Button type="submit" variant="outline" size="sm" disabled={!canSubmit || isPending}>
              {podium ? "Salvar" : "Adicionar"}
            </Button>
          )}
        </form.Subscribe>
        {podium ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Excluir pódio"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate({ id: podium.id })}
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
