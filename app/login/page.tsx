import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { LoginForm } from "@/components/login-form"

async function AuthCheck() {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (user) {
		redirect("/private/dashboard")
	}

	return null
}

export default function Login() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50">
			<Suspense fallback={null}>
				<AuthCheck />
			</Suspense>
			<LoginForm />
		</div>
	)
}
