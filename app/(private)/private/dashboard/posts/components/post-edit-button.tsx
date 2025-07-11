import React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Session } from "@supabase/supabase-js"
import {
	MoreVertical as ElipsisIcon,
	Loader2 as SpinnerIcon,
	Trash as TrashIcon,
} from "lucide-react"

import { createClient } from "@/utils/supabase/client"

import { DeletePost } from "../actions/delete-post"
import { PublishPost } from "../actions/publish-post"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const dynamic = "force-dynamic"
export const revalidate = 0

const PostEditButton = ({ id }: { id: string }) => {
	const supabase = createClient()
	const router = useRouter()
	const [showDeleteAlert, setShowDeleteAlert] = React.useState<boolean>(false)
	const [isDeleteLoading, setIsDeleteLoading] = React.useState<boolean>(false)
	const [session, setSession] = React.useState<Session | null>(null)
	const [showLoadingAlert, setShowLoadingAlert] = React.useState<boolean>(false)

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
	}, [id, session?.user.id, supabase.auth])

	async function publishMyPost() {
		setShowLoadingAlert(true)
		if (id) {
			const response = await PublishPost(id)
			if (response) {
				setShowLoadingAlert(false)
				toast.success("Post published")
				router.refresh()
			} else {
				setShowLoadingAlert(false)
				toast.error("Couldn't update post.")
			}
		} else {
			setShowLoadingAlert(false)
			toast.error("Couldn't update post.")
		}
	}

	async function deleteMyPost() {
		setIsDeleteLoading(true)
		if (id) {
			const response = await DeletePost(id)
			if (response) {
				setIsDeleteLoading(false)
				toast.success("Post deleted.")
				router.refresh()
			} else {
				setIsDeleteLoading(false)
				toast.error("Couldn't delete post.")
			}
		} else {
			setIsDeleteLoading(false)
			toast.error("Couldn't delete post.")
		}
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:bg-muted">
					<ElipsisIcon className="h-4 w-4" />
					<span className="sr-only">Open</span>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="font-sans">
					<DropdownMenuItem
						className="flex cursor-pointer items-center"
						onClick={() => publishMyPost()}
					>
						Publish
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem>
						<Button
							className="flex w-full"
							onClick={() => {
								setShowLoadingAlert(true)
								router.push(`/private/dashboard/posts/${id}`)
								setShowLoadingAlert(false)
							}}
						>
							Edit
						</Button>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="flex cursor-pointer items-center text-destructive focus:text-destructive"
						onSelect={() => setShowDeleteAlert(true)}
					>
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			<AlertDialog onOpenChange={setShowDeleteAlert} open={showDeleteAlert}>
				<AlertDialogContent className="font-sans text-md">
					<AlertDialogHeader>
						<AlertDialogTitle>
							Are you sure you want to delete this post?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={deleteMyPost}>
							{isDeleteLoading ? (
								<SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<TrashIcon className="mr-2 h-4 w-4" />
							)}
							<span>Confirm</span>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<AlertDialog onOpenChange={setShowLoadingAlert} open={showLoadingAlert}>
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

export default PostEditButton
