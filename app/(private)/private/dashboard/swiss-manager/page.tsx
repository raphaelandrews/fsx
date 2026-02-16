"use client"

import { useState, useTransition } from "react"
import { DownloadIcon, Loader2Icon, FileSpreadsheetIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"

import { generateSwissManagerExcel } from "./actions"

type RatingType = "classic" | "rapid" | "blitz"

export default function SwissManagerPage() {
	const [ratingType, setRatingType] = useState<RatingType>("rapid")
	const [isPending, startTransition] = useTransition()

	const handleExport = () => {
		startTransition(async () => {
			const result = await generateSwissManagerExcel(ratingType)

			if (result.success && result.data) {
				// Convert base64 to blob and download
				const byteCharacters = atob(result.data)
				const byteNumbers = new Array(byteCharacters.length)
				for (let i = 0; i < byteCharacters.length; i++) {
					byteNumbers[i] = byteCharacters.charCodeAt(i)
				}
				const byteArray = new Uint8Array(byteNumbers)
				const blob = new Blob([byteArray], {
					type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				})

				// Create download link
				const url = window.URL.createObjectURL(blob)
				const link = document.createElement("a")
				link.href = url
				link.download = `swiss-manager-${ratingType}-${new Date().toISOString().split("T")[0]}.xlsx`
				document.body.appendChild(link)
				link.click()
				document.body.removeChild(link)
				window.URL.revokeObjectURL(url)
			}
		})
	}

	return (
		<div className="container mx-auto py-8">
			<Card className="max-w-md mx-auto">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<FileSpreadsheetIcon className="h-5 w-5" />
						Swiss Manager Export
					</CardTitle>
					<CardDescription>
						Gere um arquivo Excel compatível com o Swiss Manager para importação de jogadores.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">Tipo de Rating</label>
						<Select
							value={ratingType}
							onValueChange={(value) => setRatingType(value as RatingType)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Selecione o tipo de rating" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="classic">Clássico</SelectItem>
								<SelectItem value="rapid">Rápido</SelectItem>
								<SelectItem value="blitz">Blitz</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<Button
						onClick={handleExport}
						disabled={isPending}
						className="w-full"
					>
						{isPending ? (
							<>
								<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
								Gerando...
							</>
						) : (
							<>
								<DownloadIcon className="mr-2 h-4 w-4" />
								Exportar Excel
							</>
						)}
					</Button>
				</CardContent>
			</Card>
		</div>
	)
}
