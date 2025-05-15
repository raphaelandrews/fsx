import { ChevronRight, Verified } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function UpdateRegister() {
  return (
    <Popover>
      <PopoverTrigger asChild className="border-0 h-auto mt-2">
        <Button
          variant="default"
          className="rounded-md px-3 py-1 gap-2"
          aria-label="Atualize seu cadastro"
        >
          <Verified
            className="size-5 min-w-5 fill-[#1CA0F2] dark:stroke-[1.5] stroke-primary"
            aria-hidden="true"
          />
          <div
            aria-hidden="true"
            className="shrink-0 bg-border w-px h-4 mx-2"
            data-orientation="vertical"
          />
          <span>Atualize seu cadastro!</span>
          <ChevronRight className="size-4 min-w-4 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[350px] max-w-[100dvw] p-4"
        align="start"
        sideOffset={8}
      >
        <div className="flex items-center gap-2">
          <Verified
            className="size-5 min-w-5 fill-[#1CA0F2] dark:stroke-[1.5] stroke-primary"
            aria-hidden="true"
          />
          <h3 className="text-primary font-semibold">Verifique seu perfil</h3>
        </div>
        <div className="space-y-2 mt-2">
          <p className="text-sm font-medium">
            Preencha o formulário para atualizar seus dados e obtenha o selo de
            verificado em seu perfil e outras informações!
          </p>
          <p className="text-sm font-medium">
            Também será possível adicionar uma foto de perfil.
          </p>
        </div>
        <a
          href="https://forms.gle/Nv8nowesZ8pKxgNQ8"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({
            variant: "default",
            className: "w-full mt-3",
          })}
        >
          Obter verificação
        </a>
      </PopoverContent>
    </Popover>
  );
}
