import { Footer } from "@/components/footer"

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<>
			<main className="mx-auto my-0 flex min-h-screen w-11/12 max-w-[500px] flex-col items-center gap-6 pt-12">
				{children}
			</main>
			<Footer className="w-11/12 max-w-lg justify-center py-8" />
		</>
	)
}
