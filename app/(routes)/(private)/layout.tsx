import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

import { Header } from "./components/header/header"
import { Footer } from "@/components/footer"

export default async function Layout({
	children,
}: {
	children: React.ReactNode
}) {
	const supabase = await createClient()

	const {
		data: { user },
		error,
	} = await supabase.auth.getUser()

	if (error || !user) {
		redirect("/login")
	}

	return (
		<>
			<Header />
			<div className="!max-w-[1120px] container relative min-h-[calc(100dvh-8.25rem)] pt-2">
				{children}
			</div>
			<Footer className="max-w-[1120px] justify-between py-6" />
		</>
	)
}
