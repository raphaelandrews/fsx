"use client"
import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Github, Loader2 } from "lucide-react"

export function LoginForm() {
	const [isLoading, setIsLoading] = useState(false)

	const handleGithubLogin = async () => {
		setIsLoading(true)
		try {
			const supabase = createClient()
			const { error } = await supabase.auth.signInWithOAuth({
				provider: "github",
				options: {
					redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/private/dashboard`,
				},
			})
			if (error) {
				console.error("Error logging in:", error.message)
			}
		} catch (error) {
			console.error("Error:", error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">Welcome Back</CardTitle>
				<CardDescription>Sign in to your account using GitHub</CardDescription>
			</CardHeader>
			<CardContent>
				<Button
					className="w-full"
					disabled={isLoading}
					onClick={handleGithubLogin}
					size="lg"
				>
					{isLoading ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Github className="mr-2 h-4 w-4" />
					)}
					Continue with GitHub
				</Button>
			</CardContent>
		</Card>
	)
}
