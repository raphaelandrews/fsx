import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
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

export function SwissManagerExport() {
  const trpc = useTRPC();
  const [ratingType, setRatingType] = useState<RatingType>("rapid");
  const [isPending, setIsPending] = useState(false);

  const { data: players = [] } = useSuspenseQuery(trpc.swissManager.list.queryOptions());

  const handleExport = () => {
    setIsPending(true);
    try {
      const blob = buildSwissManagerWorkbook(players, ratingType);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `swiss-manager-${ratingType}-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HugeiconsIcon className="size-5" icon={FileSpreadsheetIcon} strokeWidth={2} />
          Swiss Manager Export
        </CardTitle>
        <CardDescription>Generate a Swiss Manager–compatible Excel file.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Rating Type</label>
          <Select value={ratingType} onValueChange={(value) => setRatingType(value as RatingType)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a rating type">
                <span className="capitalize">{RATING_TYPE_LABELS[ratingType]}</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {RATING_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {RATING_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-muted-foreground text-sm">
          {players.length} {players.length === 1 ? "player" : "players"} will be exported.
        </p>

        <Button onClick={handleExport} disabled={isPending} className="w-full">
          {isPending ? (
            <>
              <HugeiconsIcon className="mr-2 size-4 animate-spin" icon={Loading02Icon} strokeWidth={2} />
              Generating...
            </>
          ) : (
            <>
              <HugeiconsIcon className="mr-2 size-4" icon={Download01Icon} strokeWidth={2} />
              Export Excel
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
