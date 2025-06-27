"use client"

import { CreatePost } from "../actions/create-post"
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { createClient } from "@/utils/supabase/client"
import type { Session } from "@supabase/supabase-js"
import { Loader2 as SpinnerIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import React, { useState } from "react"
import { toast } from "sonner"

const PostCreateButton = () => {
	const supabase = createClient()
	const router = useRouter()
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [session, setSession] = useState<Session | null>(null)

	// biome-ignore lint/correctness/useExhaustiveDependencies: No
	React.useEffect(() => {
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session)
		})

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session)
		})

		return () => subscription.unsubscribe()
	}, [session?.user.id, supabase.auth])

	async function createPost() {
		setIsLoading(true)

		if (session?.user.id) {
			const post = {
				title: "Untitled",
			}

			const response = await CreatePost(post.title)

			if (response) {
				toast.success("Post created.")

				router.refresh()

				router.push(`/posts/${response.id}`)
				setIsLoading(false)
			} else {
				setIsLoading(false)
				toast.error("Couldn't create post.")
			}
		} else {
			setIsLoading(false)
			toast.error("Couldn't create post.")
		}
	}

	return (
		<>
			<Button onClick={createPost} type="button">
				{isLoading && <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />}
				New Post
			</Button>
			<AlertDialog onOpenChange={setIsLoading} open={isLoading}>
				<AlertDialogContent className="font-sans">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-center">
							Please wait...
						</AlertDialogTitle>
						<AlertDialogDescription className="mx-auto text-center">
							<SpinnerIcon className="h-6 w-6 animate-spin" />
						</AlertDialogDescription>
					</AlertDialogHeader>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}

export default PostCreateButton
