import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@fsx/ui/components/select";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/players/$id")({
  head: () => ({ meta: [{ title: "Edit Player - Admin - FSX" }] }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(context.trpc.clubs.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.locations.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.titles.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.roles.list.queryOptions()),
      context.queryClient.ensureQueryData(context.trpc.insignias.list.queryOptions()),
    ]);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const numId = Number(id);

  const { data: player } = useSuspenseQuery(trpc.players.forEdit.queryOptions({ id: numId }));
  const { data: clubs = [] } = useSuspenseQuery(trpc.clubs.list.queryOptions());
  const { data: locations = [] } = useSuspenseQuery(trpc.locations.list.queryOptions());
  const { data: titles = [] } = useSuspenseQuery(trpc.titles.list.queryOptions());
  const { data: roles = [] } = useSuspenseQuery(trpc.roles.list.queryOptions());
  const { data: insignias = [] } = useSuspenseQuery(trpc.insignias.list.queryOptions());
  const { data: playerTitles = [] } = useSuspenseQuery(trpc.playersToTitles.listByPlayer.queryOptions({ playerId: numId }));
  const { data: playerRoles = [] } = useSuspenseQuery(trpc.playersToRoles.listByPlayer.queryOptions({ playerId: numId }));
  const { data: playerInsignias = [] } = useSuspenseQuery(trpc.playersToInsignias.listByPlayer.queryOptions({ playerId: numId }));

  const updateMutation = useMutation({
    ...trpc.players.update.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.players.forEdit.queryFilter({ id: numId }));
      toast.success("Player updated");
    },
    onError: () => toast.error("Failed to update player"),
  });

  const linkTitleMutation = useMutation({
    ...trpc.playersToTitles.link.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.playersToTitles.listByPlayer.queryFilter({ playerId: numId }));
      toast.success("Title assigned");
    },
    onError: () => toast.error("Failed to assign title"),
  });

  const unlinkTitleMutation = useMutation({
    ...trpc.playersToTitles.unlink.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.playersToTitles.listByPlayer.queryFilter({ playerId: numId }));
      toast.success("Title removed");
    },
    onError: () => toast.error("Failed to remove title"),
  });

  const linkRoleMutation = useMutation({
    ...trpc.playersToRoles.link.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.playersToRoles.listByPlayer.queryFilter({ playerId: numId }));
      toast.success("Role assigned");
    },
    onError: () => toast.error("Failed to assign role"),
  });

  const unlinkRoleMutation = useMutation({
    ...trpc.playersToRoles.unlink.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.playersToRoles.listByPlayer.queryFilter({ playerId: numId }));
      toast.success("Role removed");
    },
    onError: () => toast.error("Failed to remove role"),
  });

  const linkInsigniaMutation = useMutation({
    ...trpc.playersToInsignias.link.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.playersToInsignias.listByPlayer.queryFilter({ playerId: numId }));
      toast.success("Insignia assigned");
    },
    onError: () => toast.error("Failed to assign insignia"),
  });

  const unlinkInsigniaMutation = useMutation({
    ...trpc.playersToInsignias.unlink.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries(trpc.playersToInsignias.listByPlayer.queryFilter({ playerId: numId }));
      toast.success("Insignia removed");
    },
    onError: () => toast.error("Failed to remove insignia"),
  });

  if (!player) {
    return <p>Player not found.</p>;
  }

  const form = useForm({
    defaultValues: {
      name: player.name,
      nickname: player.nickname ?? "",
      blitz: player.blitz,
      rapid: player.rapid,
      classic: player.classic,
      birthDate: player.birthDate ?? "",
      sex: player.sex as "male" | "female",
      clubId: player.clubId,
      locationId: player.locationId,
      active: player.active,
    },
    onSubmit: ({ value }) => {
      updateMutation.mutate({
        id: numId,
        name: value.name,
        nickname: value.nickname || null,
        blitz: value.blitz,
        rapid: value.rapid,
        classic: value.classic,
        birthDate: value.birthDate || null,
        sex: value.sex,
        clubId: value.clubId,
        locationId: value.locationId,
        active: value.active,
      });
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Edit Player: {player.name}</h1>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard/players" })}>Back</Button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="name">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Name</Label>
              <Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />
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
        <form.Field name="birthDate">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Birth</Label>
              <Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />
            </div>
          )}
        </form.Field>
        <div className="grid grid-cols-3 gap-4">
          <form.Field name="sex">
            {(f) => (
              <div className="space-y-2">
                <Label>Sex</Label>
                <select
                  value={f.state.value}
                  onChange={(e) => f.handleChange(e.target.value as "male" | "female")}
                  onBlur={f.handleBlur}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            )}
          </form.Field>
          <form.Field name="active">
            {(f) => (
              <div className="flex items-center gap-2">
                <input id={f.name} type="checkbox" checked={f.state.value} onChange={(e) => f.handleChange(e.target.checked)} className="h-4 w-4 rounded border-input" />
                <Label htmlFor={f.name}>Active</Label>
              </div>
            )}
          </form.Field>
        </div>
        <form.Field name="clubId">
          {(f) => (
            <div className="space-y-2">
              <Label>Club</Label>
              <Select value={f.state.value?.toString() ?? ""} onValueChange={(v) => f.handleChange(v ? Number(v) : null)}>
                <SelectTrigger><SelectValue placeholder="Select club" /></SelectTrigger>
                <SelectContent>
                  {clubs.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>
        <form.Field name="locationId">
          {(f) => (
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={f.state.value?.toString() ?? ""} onValueChange={(v) => f.handleChange(v ? Number(v) : null)}>
                <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent>
                  {locations.map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-8 space-y-6">
        <section>
          <h2 className="mb-2 font-semibold text-lg">Titles</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {playerTitles.map((pt) => (
              <span key={pt.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
                {pt.title?.name}
                <button
                  type="button"
                  className="ml-1 text-muted-foreground hover:text-destructive"
                  onClick={() => unlinkTitleMutation.mutate({ id: pt.id })}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Select onValueChange={(v) => { if (v) linkTitleMutation.mutate({ playerId: numId, titleId: Number(v) }); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Add title" /></SelectTrigger>
              <SelectContent>
                {titles.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-lg">Roles</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {playerRoles.map((pr) => (
              <span key={pr.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
                {pr.role?.name}
                <button
                  type="button"
                  className="ml-1 text-muted-foreground hover:text-destructive"
                  onClick={() => unlinkRoleMutation.mutate({ id: pr.id })}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Select onValueChange={(v) => { if (v) linkRoleMutation.mutate({ playerId: numId, roleId: Number(v) }); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Add role" /></SelectTrigger>
              <SelectContent>
                {roles.map((r) => <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-lg">Insignias</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {playerInsignias.map((pi) => (
              <span key={pi.id} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
                {pi.insignia?.name}
                <button
                  type="button"
                  className="ml-1 text-muted-foreground hover:text-destructive"
                  onClick={() => unlinkInsigniaMutation.mutate({ id: pi.id })}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Select onValueChange={(v) => { if (v) linkInsigniaMutation.mutate({ playerId: numId, insigniaId: Number(v) }); }}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Add insignia" /></SelectTrigger>
              <SelectContent>
                {insignias.map((i) => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </section>
      </div>
    </div>
  );
}
