import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";
import z from "zod";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/players/create")({
  head: () => ({ title: "Create Player - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useMutation({
    ...trpc.players.create.mutationOptions(),
    onSuccess: () => {
      toast.success("Player created");
      navigate({ to: "/dashboard/players" });
    },
    onError: () => toast.error("Failed to create player"),
  });

  const form = useForm({
    defaultValues: {
      name: "",
      nickname: "",
      blitz: 1900,
      rapid: 1900,
      classic: 1900,
      birth: "",
      sex: false as boolean,
      clubId: null as number | null,
      locationId: null as number | null,
    },
    onSubmit: ({ value }) => {
      createMutation.mutate({
        name: value.name,
        nickname: value.nickname || null,
        blitz: value.blitz,
        rapid: value.rapid,
        classic: value.classic,
        birth: value.birth || null,
        sex: value.sex,
        clubId: value.clubId,
        locationId: value.locationId,
      });
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Name is required"),
      }),
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Player</h1>
      <form
        onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}
        className="space-y-4"
      >
        <form.Field name="name">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Name</Label>
              <Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />
              {f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}
            </div>
          )}
        </form.Field>
        <form.Field name="nickname">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Nickname</Label>
              <Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />
            </div>
          )}
        </form.Field>
        <div className="grid grid-cols-3 gap-4">
          <form.Field name="blitz">
            {(f) => (
              <div className="space-y-2">
                <Label htmlFor={f.name}>Blitz</Label>
                <Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} />
              </div>
            )}
          </form.Field>
          <form.Field name="rapid">
            {(f) => (
              <div className="space-y-2">
                <Label htmlFor={f.name}>Rapid</Label>
                <Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} />
              </div>
            )}
          </form.Field>
          <form.Field name="classic">
            {(f) => (
              <div className="space-y-2">
                <Label htmlFor={f.name}>Classic</Label>
                <Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} />
              </div>
            )}
          </form.Field>
        </div>
        <form.Field name="birth">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Birth (YYYY-MM-DD)</Label>
              <Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />
            </div>
          )}
        </form.Field>
        <form.Field name="sex">
          {(f) => (
            <div className="flex items-center gap-2">
              <input
                id={f.name}
                type="checkbox"
                checked={f.state.value}
                onChange={(e) => f.handleChange(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor={f.name}>Female</Label>
            </div>
          )}
        </form.Field>
        <form.Field name="clubId">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Club ID</Label>
              <Input id={f.name} type="number" value={f.state.value?.toString() ?? ""} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value ? Number(e.target.value) : null)} />
            </div>
          )}
        </form.Field>
        <form.Field name="locationId">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Location ID</Label>
              <Input id={f.name} type="number" value={f.state.value?.toString() ?? ""} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value ? Number(e.target.value) : null)} />
            </div>
          )}
        </form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Player"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
