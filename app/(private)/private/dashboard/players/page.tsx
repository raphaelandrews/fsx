import { Separator } from "@/components/ui/separator"
import { PlayerSearch } from "./components/player-search"

export default function Page() {
	return (
		<div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
			<div>
				<h3 className="font-medium text-lg">Players</h3>
				<p className="py-2 text-muted-foreground text-sm">
					Search and edit player information
				</p>
			</div>
			<Separator className="mb-5" />
			<PlayerSearch />
		</div>
	)
}
