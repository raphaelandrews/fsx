import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import z from "zod";

import { CIRCUIT_CATEGORIES } from "@fsx/api/circuit-types";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";

import { SearchableSelect } from "@/components/searchable-select";
import { useTRPC } from "@/utils/trpc";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

import type { CircuitPodium } from "../types";
import { useInvalidateAdmin } from "@/lib/admin-mutations";

export type PodiumTarget = { circuitId?: number; circuitPhaseId?: number };

const podiumSchema = z.object({
  playerId: z.string().min(1, "Jogador é obrigatório"),
  category: z.enum(CIRCUIT_CATEGORIES).or(z.literal("")),
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
  const invalidateAdmin = useInvalidateAdmin();

  const createMutation = useMutation({
    ...trpc.circuits.podiums.create.mutationOptions(),
    onSuccess: () => {
      void invalidateAdmin("circuits");
      toast.success("Pódio adicionado");
    },
    onError: () => toast.error("Falha ao adicionar pódio"),
  });

  const updateMutation = useMutation({
    ...trpc.circuits.podiums.update.mutationOptions(),
    onSuccess: () => {
      void invalidateAdmin("circuits");
      toast.success("Pódio atualizado");
    },
    onError: () => toast.error("Falha ao atualizar pódio"),
  });

  const deleteMutation = useMutation({
    ...trpc.circuits.podiums.delete.mutationOptions(),
    onSuccess: () => {
      void invalidateAdmin("circuits");
      toast.success("Pódio removido");
    },
    onError: () => toast.error("Falha ao remover pódio"),
  });

  const isPending = podium ? updateMutation.isPending : createMutation.isPending;

  const form = useForm({
    defaultValues: {
      playerId: podium ? String(podium.playerId) : "",
      category: (podium?.category ?? "") as (typeof CIRCUIT_CATEGORIES)[number] | "",
      place: podium?.place != null ? String(podium.place) : "",
      points: podium ? String(podium.points) : "",
    },
    validators: { onSubmit: podiumSchema },
    onSubmit: ({ value }) => {
      const payload = {
        playerId: Number(value.playerId),
        circuitId: target.circuitId ?? null,
        circuitPhaseId: target.circuitPhaseId ?? null,
        category: value.category === "" ? null : value.category as (typeof CIRCUIT_CATEGORIES)[number],
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
            <select
              id={f.name}
              value={f.state.value}
              onBlur={f.handleBlur}
              onChange={(e) => f.handleChange(e.target.value as (typeof CIRCUIT_CATEGORIES)[number] | "")}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">Sem categoria</option>
              {CIRCUIT_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
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
          <ConfirmDeleteButton
            itemName="classificação de jogador"
            label="Excluir pódio"
            pending={deleteMutation.isPending}
            onConfirm={() => deleteMutation.mutate({ id: podium.id })}
          />
        ) : null}
      </div>
    </form>
  );
}
