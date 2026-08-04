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

export function UpdateRegister() {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger>
          <PopoverTrigger>
            <Button
              aria-label="Atualize seu cadastro"
              size="icon"
              variant="outline"
            >
              <svg
                aria-hidden="true"
                className="size-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>Verified Icon</title>
                <path d="M9 12l2 2 4-4" className="stroke-white dark:stroke-[1.5]" />
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" className="fill-[#1CA0F2]" />
              </svg>
            </Button>
          </PopoverTrigger>
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
          <svg
            aria-hidden="true"
            className="size-5 min-w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <title>Verified Icon</title>
            <path d="M9 12l2 2 4-4" className="stroke-primary dark:stroke-[1.5]" />
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" className="fill-[#1CA0F2]" />
          </svg>
          <h3 className="font-semibold text-primary">Verifique seu perfil</h3>
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
            className: "mt-3 w-full",
          })}
          href="https://forms.gle/Nv8nowesZ8pKxgNQ8"
          rel="noopener noreferrer"
          target="_blank"
        >
          Obter verificacao
        </a>
      </PopoverContent>
    </Popover>
  )
}
