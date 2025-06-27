"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut, Loader2 } from "lucide-react"

export function LogoutButton() {
	const [isLoading, setIsLoading] = useState(false)
	const router = useRouter()
	const supabase = createClient()

	const handleLogout = async () => {
		setIsLoading(true)
		try {
			const { error } = await supabase.auth.signOut()
			if (error) {
				console.error("Error logging out:", error.message)
			} else {
				router.push("/login")
				router.refresh()
			}
		} catch (error) {
			console.error("Error:", error)
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<Button
			className="p-2"
			disabled={isLoading}
			onClick={handleLogout}
			size="sm"
			variant="outline"
		>
			{isLoading ? (
				<Loader2 className="size-4 animate-spin" />
			) : (
				<LogOut className="size-4" />
			)}
		</Button>
	)
}
