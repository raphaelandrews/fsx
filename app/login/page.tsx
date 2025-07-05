import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { LoginForm } from "@/components/login-form"

export default async function Login() {
	const supabase = await createClient()

	const {
		data: { user },
	} = await supabase.auth.getUser()

	if (user) {
		redirect("/private/dashboard");
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50">
			<LoginForm />
		</div>
	)
}
