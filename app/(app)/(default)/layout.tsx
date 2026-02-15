import { Footer } from "@/components/footer"
import { Header } from "@/components/header/header"

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-dvh flex-col">
			<Header />
			<main className="relative flex-1">
				<div className="absolute inset-y-0 left-1/2 w-full max-w-[720px] -translate-x-1/2 mx-2 sm:mx-8 md:mx-0 dotted-border-x pointer-events-none" />
				<div className="relative">
					{children}
				</div>
			</main>
			<Footer />
		</div>
	)
}
