import { useQuery } from "@tanstack/react-query";

import { Button } from "@fsx/ui/components/button";

import { AdminSection } from "@/components/admin/form-layout";
import { useTRPC } from "@/utils/trpc";

// Players whose full name appears in the saved text; linking one saves only
// the player, so save other edits first.
export function SuggestedPlayers({
  content,
  pending,
  onLink,
}: {
  content: string;
  pending: boolean;
  onLink: (playerId: number) => void;
}) {
  const trpc = useTRPC();
  const { data: suggestions = [], isLoading } = useQuery(trpc.announcements.suggestPlayers.queryOptions({ content }));

  return (
    <AdminSection
      title="Suggested players"
      description="Players whose full name appears in the saved text. Save other changes before linking one."
    >
      {isLoading ? (
        <p className="py-4 text-muted-foreground text-sm">Looking for players…</p>
      ) : suggestions.length === 0 ? (
        <p className="py-4 text-muted-foreground text-sm">No player name found in the text.</p>
      ) : (
        <ul className="divide-y">
          {suggestions.map((player) => (
            <li key={player.id} className="flex items-center justify-between gap-2 py-2">
              <span className="text-sm">
                {player.name} <span className="text-muted-foreground">#{player.id}</span>
              </span>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => onLink(player.id)}>
                Link player
              </Button>
            </li>
          ))}
        </ul>
      )}
    </AdminSection>
  );
}
