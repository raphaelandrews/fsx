import { Link } from "@tanstack/react-router"

import { Button, buttonVariants } from "@fsx/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@fsx/ui/components/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@fsx/ui/components/tooltip"

import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkBadge01Icon } from "@hugeicons/core-free-icons"

export function UpdateRegister() {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <Button
                  aria-label="Atualize seu cadastro"
                  className="border-border"
                  size="icon-xl"
                  variant="secondary"
                />
              }
            />
          }
        >
          <HugeiconsIcon
            icon={CheckmarkBadge01Icon}
            className="size-5 text-primary-foreground [&_path:first-child]:fill-primary"
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>Atualize seu cadastro</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        align="start"
        className="w-[350px] max-w-[100dvw] p-4"
        sideOffset={8}
      >
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={CheckmarkBadge01Icon}
            className="size-5 text-primary-foreground [&_path:first-child]:fill-primary"
          />

          <h3 className="font-semibold">Verifique seu perfil</h3>
        </div>
        <div className="mt-2 space-y-2">
          <p className="font-medium text-base">
            Envie seus dados para a FSX conferir e receba o selo de verificado no
            seu perfil.
          </p>
          <p className="font-medium text-base">
            Você pode corrigir data de nascimento, clube, cidade e os IDs da CBX e da FIDE.
          </p>
        </div>
        <Link
          className={buttonVariants({
            variant: "default",
            size: "lg",
            className: "mt-3 w-full active:scale-[0.96]",
          })}
          to="/atualizar-cadastro"
        >
          Obter Verificação
        </Link>
      </PopoverContent>
    </Popover>
  )
}
