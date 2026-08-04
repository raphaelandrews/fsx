import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";
import { toast } from "sonner";
import { useState } from "react";

import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/cache/")({
  head: () => ({ title: "Cache - Admin - FSX" }),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const [tag, setTag] = useState("");

  const revalidateMutation = useMutation({
    ...trpc.cache.revalidateTag.mutationOptions(),
    onSuccess: () => toast.success("Cache invalidated"),
    onError: () => toast.error("Failed to invalidate cache"),
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">Cache</h1>
      <p className="mb-4 text-muted-foreground text-sm">
        Invalidate cached data by tag. Common tags: posts, players, events, announcements.
      </p>
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="tag">Tag</Label>
          <Input id="tag" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="e.g. posts" />
        </div>
        <div className="self-end">
          <Button onClick={() => { if (tag) revalidateMutation.mutate({ tag }); }} disabled={!tag || revalidateMutation.isPending}>
            {revalidateMutation.isPending ? "Revalidating..." : "Invalidate"}
          </Button>
        </div>
      </div>
    </div>
  );
}
