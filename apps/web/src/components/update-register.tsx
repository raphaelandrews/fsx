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
          <p className="font-medium text-sm">
            Preencha o formulario para atualizar seus dados e obtenha o selo de
            verificado em seu perfil e outras informacoes!
          </p>
          <p className="font-medium text-sm">
            Tambem sera possivel adicionar uma foto de perfil.
          </p>
        </div>
        <a
          className={buttonVariants({
            variant: "default",
            size: "lg",
            className: "mt-3 w-full active:scale-[0.96]",
          })}
          href="https://forms.gle/Nv8nowesZ8pKxgNQ8"
          rel="noopener noreferrer"
          target="_blank"
        >
          Obter Verificação
        </a>
      </PopoverContent>
    </Popover>
  )
}
