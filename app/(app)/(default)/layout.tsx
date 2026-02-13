import { Footer } from "@/components/footer"
import { Header } from "@/components/header/header"

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<Header />
			<div className="relative min-h-[calc(100dvh-6.8rem)]">
				{children}
			</div>
			<Footer className="justify-between py-6" />
		</>
	)
}
