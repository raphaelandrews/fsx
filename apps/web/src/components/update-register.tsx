import { ChevronRight, Verified } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const UpdateRegister = () => {
  return (
    <Popover>
      <PopoverTrigger asChild className="border-0 h-auto">
        <Button variant="default" className="rounded-md px-3 py-1 gap-0">
          <Verified
            className="!fill-[#1CA0F2] dark:stroke-[1.5] stroke-primary w-5 h-5 min-w-[1.25rem]"
            aria-label="Verificado"
          />
          <div
            data-orientation="vertical"
            className="shrink-0 bg-border w-[1px] mx-2 h-4"
          />
          Atualize seu cadastro!
          <ChevronRight className="ml-1 h-4 w-4 min-w-[1rem]" />
          <span className="sr-only">Open popover</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] max-w-[100vw]">
        <div className="flex items-center gap-1">
          <Verified
            className="!fill-[#1CA0F2] dark:stroke-[1.5] stroke-primary w-5 h-5 min-w-[1.25rem]"
            aria-label="Verificado"
          />
          <p className="text-primary font-semibold">Verifique seu perfil</p>
        </div>
        <p className="font-medium text-sm mt-2">
          Preencha o formulário para atualizar seus dados e obtenha o selo de
          verificado em seu perfil e outras informações!
        </p>
        <p className="font-medium text-sm mt-2">
          Também será possível adicionar uma foto de perfil.
        </p>
        <a
          href="https://forms.gle/Nv8nowesZ8pKxgNQ8"
          target="_blank"
          rel="noreferrer"
          className={`${buttonVariants({ variant: "default" })} w-full mt-3`}
        >
          Obter verificação
        </a>
      </PopoverContent>
    </Popover>
  );
};

export default UpdateRegister;
