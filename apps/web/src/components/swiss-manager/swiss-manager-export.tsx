import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon, FileSpreadsheetIcon, Loading02Icon } from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@fsx/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@fsx/ui/components/select";

import { useTRPC } from "@/utils/trpc";
import {
  buildSwissManagerWorkbook,
  RATING_TYPES,
  RATING_TYPE_LABELS,
  type RatingType,
} from "./swiss-manager-workbook";

const TEXT = {
  en: {
    title: "Swiss Manager Export",
    description: "Generate a Swiss Manager–compatible Excel file.",
    ratingType: "Rating Type",
    ratingTypeLabel: "Rating type",
    placeholder: "Select a rating type",
    labels: RATING_TYPE_LABELS,
    exported: (count: number) => `${count} ${count === 1 ? "player" : "players"} exported.`,
    hint: "Downloads every player with name, sex, birth date, club, and the chosen rating.",
    generating: "Generating...",
    button: "Export Excel",
    failed: "Failed to generate the file",
  },
  pt: {
    title: "Exportar para o Swiss Manager",
    description: "Gere um arquivo Excel compatível com o Swiss Manager.",
    ratingType: "Ritmo",
    ratingTypeLabel: "Ritmo",
    placeholder: "Selecione o ritmo",
    labels: { classic: "Clássico", rapid: "Rápido", blitz: "Blitz" } satisfies Record<RatingType, string>,
    exported: (count: number) => `${count} ${count === 1 ? "jogador exportado" : "jogadores exportados"}.`,
    hint: "Baixa todos os jogadores com nome, sexo, data de nascimento, clube e o rating escolhido.",
    generating: "Gerando...",
    button: "Baixar Excel",
    failed: "Não foi possível gerar o arquivo",
  },
} as const;

// The roster is fetched on click rather than in the route loader so page views
// (and crawlers) never receive every player's birth date in the HTML.
export function SwissManagerExport({ locale = "en" }: { locale?: keyof typeof TEXT }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const text = TEXT[locale];
  const [ratingType, setRatingType] = useState<RatingType>("rapid");
  const [isPending, setIsPending] = useState(false);
  const [exportedCount, setExportedCount] = useState<number | null>(null);

  const handleExport = async () => {
    setIsPending(true);
    try {
      const players = await queryClient.fetchQuery(trpc.swissManager.list.queryOptions());
      const blob = await buildSwissManagerWorkbook(players, ratingType);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `swiss-manager-${ratingType}-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportedCount(players.length);
    } catch {
      toast.error(text.failed);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon className="size-5" icon={FileSpreadsheetIcon} strokeWidth={2} />
          {text.title}
        </CardTitle>
        <CardDescription>{text.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-base font-medium">{text.ratingType}</label>
          <Select value={ratingType} onValueChange={(value) => setRatingType(value as RatingType)}>
            <SelectTrigger aria-label={text.ratingTypeLabel}>
              <SelectValue placeholder={text.placeholder}>
                <span className="capitalize">{text.labels[ratingType]}</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {RATING_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {text.labels[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-muted-foreground text-base" aria-live="polite">
          {exportedCount === null ? text.hint : text.exported(exportedCount)}
        </p>

        <Button onClick={handleExport} disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <HugeiconsIcon className="mr-2 size-4 animate-spin" icon={Loading02Icon} strokeWidth={2} />
              {text.generating}
            </>
          ) : (
            <>
              <HugeiconsIcon className="mr-2 size-4" icon={Download01Icon} strokeWidth={2} />
              {text.button}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
