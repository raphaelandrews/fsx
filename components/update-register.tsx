import { VerifiedIcon } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"

export function UpdateRegister() {
	return (
		<Popover>
			<Tooltip>
				<TooltipTrigger asChild>
					<PopoverTrigger asChild>
						<Button
							aria-label="Atualize seu cadastro"
							size="square"
							variant="dashed"
						>
							<VerifiedIcon
								aria-hidden="true"
								className="size-4 shrink-0 fill-[#1CA0F2] stroke-white dark:stroke-[1.5]"
							/>
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
					<VerifiedIcon
						aria-hidden="true"
						className="size-5 min-w-5 fill-[#1CA0F2] stroke-primary dark:stroke-[1.5]"
					/>
					<h3 className="font-semibold text-primary">Verifique seu perfil</h3>
				</div>
				<div className="mt-2 space-y-2">
					<p className="font-medium text-sm">
						Preencha o formulário para atualizar seus dados e obtenha o selo de
						verificado em seu perfil e outras informações!
					</p>
					<p className="font-medium text-sm">
						Também será possível adicionar uma foto de perfil.
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
					Obter verificação
				</a>
			</PopoverContent>
		</Popover>
	)
}
