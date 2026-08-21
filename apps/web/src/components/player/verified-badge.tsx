
import { HugeiconsIcon } from "@hugeicons/react"
import { IdVerifiedIcon } from "@hugeicons/core-free-icons"

import { buttonVariants } from "@fsx/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@fsx/ui/components/popover"
import { Separator } from "@fsx/ui/components/separator"

type Role = { role: { type: string } }

type VerifiedTier = "admin" | "management" | "referee" | "verified"

function getTier(
  playerId: number,
  roles: Role[],
  verified: boolean,
): VerifiedTier | null {
  if (playerId === 1) return "admin"
  if (roles.some((r) => r.role.type === "management")) return "management"
  if (roles.some((r) => r.role.type === "referee")) return "referee"
  if (verified) return "verified"
  return null
}

const TIER_CONFIG: Record<
  VerifiedTier,
  { iconClass: string; label: string; description: string }
> = {
  admin: {
    iconClass:
      "!fill-bulbasaur mt-1 stroke-none [&_path:last-child]:stroke-white [&_path:last-child]:[stroke-width:1.5]",
    label: "Diretoria",
    description: "Este jogador faz parte da diretoria da federação.",
  },
  management: {
    iconClass:
      "!fill-highlight mt-1 stroke-none [&_path:last-child]:stroke-white [&_path:last-child]:[stroke-width:1.5]",
    label: "Diretoria",
    description: "Este jogador faz parte da diretoria da federação.",
  },
  referee: {
    iconClass:
      "!fill-slate-500 mt-1 stroke-none [&_path:last-child]:stroke-white [&_path:last-child]:[stroke-width:1.5]",
    label: "Árbitro Oficial",
    description: "Este jogador é um árbitro oficial da federação.",
  },
  verified: {
    iconClass:
      "!fill-sky-400 mt-1 stroke-none [&_path:last-child]:stroke-white [&_path:last-child]:[stroke-width:1.5]",
    label: "Perfil verificado",
    description: "Esse perfil teve seus dados confirmados pela federação.",
  },
}

interface VerifiedBadgeProps {
  playerId: number
  roles: Role[]
  verified: boolean
}

export function VerifiedBadge({
  playerId,
  roles,
  verified,
}: VerifiedBadgeProps) {
  const tier = getTier(playerId, roles, verified)
  if (!tier) return null
  const { iconClass, label, description } = TIER_CONFIG[tier]
  const showVerifiedSection = verified && tier !== "verified"

  return (
    <Popover>
      <PopoverTrigger className="cursor-pointer">
        <HugeiconsIcon
          icon={IdVerifiedIcon}
          aria-label={label}
          className={iconClass}
        />
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-2">
          <h4 className="font-semibold leading-none">{label}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>

          {showVerifiedSection && (
            <>
              <Separator />
              <h4 className="font-semibold leading-none">Perfil verificado</h4>
              <p className="text-sm text-muted-foreground">
                Esse perfil teve seus dados confirmados pela federação.
              </p>
            </>
          )}

          {verified && (
            <a
              className={buttonVariants({
                variant: "outline",
                className: "w-full",
              })}
              href="https://forms.gle/Nv8nowesZ8pKxgNQ8"
              target="_blank"
              rel="noreferrer"
            >
              Solicitar verificação
            </a>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
