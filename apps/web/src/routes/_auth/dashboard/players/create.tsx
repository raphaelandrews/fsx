import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";
import z from "zod";

import { ImageUpload } from "@/components/image-upload";
import { usePendingImageDeletes } from "@/hooks/use-pending-image-deletes";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/players/create")({
  head: () => ({ meta: [{ title: "Create Player - Admin - FSX" }] }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { track: trackImageReplaced, flush: flushImageDeletes } = usePendingImageDeletes();

  const createMutation = useMutation({
    ...trpc.players.create.mutationOptions(),
    onSuccess: async () => {
      qc.invalidateQueries(trpc.players.list.queryFilter());
      await flushImageDeletes();
      toast.success("Player created");
      navigate({ to: "/dashboard/players" });
    },
    onError: (error) => toast.error(error.message ?? "Failed to create player"),
  });

  const form = useForm({
    defaultValues: {
      name: "",
      nickname: "",
      blitz: 1900,
      rapid: 1900,
      classic: 1900,
      birthDate: "",
      sex: "male" as "male" | "female",
      clubId: null as number | null,
      locationId: null as number | null,
      imageUrl: "",
    },
    onSubmit: ({ value }) => {
      createMutation.mutate({
        name: value.name,
        nickname: value.nickname || null,
        blitz: value.blitz,
        rapid: value.rapid,
        classic: value.classic,
        birthDate: value.birthDate || null,
        sex: value.sex,
        clubId: value.clubId,
        locationId: value.locationId,
        imageUrl: value.imageUrl || null,
      });
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Name is required"),
        nickname: z.string(),
        blitz: z.number(),
        rapid: z.number(),
        classic: z.number(),
        birthDate: z.string(),
        sex: z.enum(["male", "female"]),
        clubId: z.number().nullable(),
        locationId: z.number().nullable(),
        imageUrl: z.string(),
      }),
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Player</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="name">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Name</Label>
              <Input
                id={f.name}
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
        <form.Field name="nickname">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Nickname</Label>
              <Input
                id={f.name}
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="imageUrl">
          {(f) => (
            <div className="space-y-2">
              <Label>Photo</Label>
              <ImageUpload
                kind="players"
                value={f.state.value || null}
                onChange={(url) => f.handleChange(url ?? "")}
                onImageReplaced={trackImageReplaced}
                title="Crop Player Photo"
                description="Adjust the crop area for a square avatar."
                outputWidth={120}
              />
            </div>
          )}
        </form.Field>
        <div className="grid grid-cols-3 gap-4">
          <form.Field name="blitz">
            {(f) => (
              <div className="space-y-2">
                <Label htmlFor={f.name}>Blitz</Label>
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
          <form.Field name="rapid">
            {(f) => (
              <div className="space-y-2">
                <Label htmlFor={f.name}>Rapid</Label>
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
          <form.Field name="classic">
            {(f) => (
              <div className="space-y-2">
                <Label htmlFor={f.name}>Classic</Label>
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
        </div>
        <form.Field name="birthDate">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Birth (YYYY-MM-DD)</Label>
              <Input
                id={f.name}
                value={f.state.value}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value)}
              />
            </div>
          )}
        </form.Field>
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
        <form.Field name="clubId">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Club ID</Label>
              <Input
                id={f.name}
                type="number"
                value={f.state.value?.toString() ?? ""}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          )}
        </form.Field>
        <form.Field name="locationId">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Location ID</Label>
              <Input
                id={f.name}
                type="number"
                value={f.state.value?.toString() ?? ""}
                onBlur={f.handleBlur}
                onChange={(e) => f.handleChange(e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          )}
        </form.Field>
        <form.Subscribe
          selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
        >
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
