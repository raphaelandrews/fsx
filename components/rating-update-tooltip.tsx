import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function RatingUpdateTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild>
          <Link href="/showcase/atualizacao-rating" prefetch={false}>
            Atualização de Rating
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Entenda como é o processo de atualização de rating.</p>
      </TooltipContent>
    </Tooltip>
  );
}
