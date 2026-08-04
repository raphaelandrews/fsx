import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { Textarea } from "@fsx/ui/components/textarea";
import { toast } from "sonner";
import z from "zod";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/announcements/create")({
  head: () => ({ title: "Create Announcement - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();

  const createMutation = useMutation({
    ...trpc.announcements.create.mutationOptions(),
    onSuccess: () => {
      toast.success("Announcement created");
      navigate({ to: "/dashboard/announcements" });
    },
    onError: () => toast.error("Failed to create announcement"),
  });

  const form = useForm({
    defaultValues: { year: new Date().getFullYear(), number: "", content: "" },
    onSubmit: ({ value }) => {
      createMutation.mutate({ year: value.year, number: value.number, content: value.content });
    },
    validators: {
      onSubmit: z.object({
        year: z.number().int().min(2000),
        number: z.string().min(1, "Number is required"),
        content: z.string().min(1, "Content is required"),
      }),
    },
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Create Announcement</h1>
      <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4">
        <form.Field name="year">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Year</Label>
              <Input id={f.name} type="number" value={String(f.state.value)} onBlur={f.handleBlur} onChange={(e) => f.handleChange(Number(e.target.value))} />
              {f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}
            </div>
          )}
        </form.Field>
        <form.Field name="number">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Number</Label>
              <Input id={f.name} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />
              {f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}
            </div>
          )}
        </form.Field>
        <form.Field name="content">
          {(f) => (
            <div className="space-y-2">
              <Label htmlFor={f.name}>Content</Label>
              <Textarea id={f.name} rows={4} value={f.state.value} onBlur={f.handleBlur} onChange={(e) => f.handleChange(e.target.value)} />
              {f.state.meta.errors.map((e) => <p key={e?.message} className="text-destructive text-xs">{e?.message}</p>)}
            </div>
          )}
        </form.Field>
        <form.Subscribe selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}>
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Announcement"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
