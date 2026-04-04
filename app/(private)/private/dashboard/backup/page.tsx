import { DownloadIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function Page() {
	return (
		<div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
			<div>
				<h3 className="font-medium text-lg">Backup</h3>
				<p className="py-2 text-muted-foreground text-sm">
					Download all data from all tables as a JSON file
				</p>
			</div>
			<Separator className="mb-5" />
			<a href="/private/dashboard/backup/download">
				<Button>
					<DownloadIcon className="mr-2 h-4 w-4" />
					Download Backup
				</Button>
			</a>
		</div>
	)
}
