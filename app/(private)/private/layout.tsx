import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

async function AuthGuard({ children }: { children: React.ReactNode }) {
	const supabase = await createClient()
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser()

	if (error || !user) {
		redirect("/login")
	}

	return <>{children}</>
}

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<AuthGuard>{children}</AuthGuard>
		</Suspense>
	)
}
