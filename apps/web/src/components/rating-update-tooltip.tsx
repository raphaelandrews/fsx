import { Link } from "@tanstack/react-router"

import { buttonVariants } from "@fsx/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@fsx/ui/components/tooltip"

export function RatingUpdateTooltip() {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Link className={buttonVariants()} to="/rating-update" />}
      >
        Atualizacao de Rating
      </TooltipTrigger>
      <TooltipContent>
        <p>Entenda como e o processo de atualizacao de rating.</p>
      </TooltipContent>
    </Tooltip>
  )
}
