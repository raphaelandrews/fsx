import { Link } from "@tanstack/react-router"

import { Button } from "@fsx/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@fsx/ui/components/tooltip"

export function RatingUpdateTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button>
          <Link to="/rating-update">
            Atualizacao de Rating
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Entenda como e o processo de atualizacao de rating.</p>
      </TooltipContent>
    </Tooltip>
  )
}
