import { cn } from "@fsx/ui/lib/utils"

export function Footer({ className }: { className?: string }) {
	return (
		<footer className={cn(className)}>
			<div className="max-w-[720px] mx-2 sm:mx-8 md:mx-auto relative p-3">
				<div className="text-balance text-center text-muted-foreground text-sm leading-loose">
					Built by 📟{" "}
					<a
						className="font-medium text-bulbasaur-foreground transition duration-200 hover:text-highlight"
						href="https://andrews.sh/"
						rel="noreferrer"
						target="_blank"
					>
						Andrews
					</a>
					.{" "}
					<a
						className="font-medium transition duration-200 hover:text-highlight"
						href="https://github.com/raphaelandrews/fsx"
						rel="noreferrer"
						target="_blank"
					>
						Source code
					</a>
					.
				</div>
			</div>
		</footer>
	)
}
