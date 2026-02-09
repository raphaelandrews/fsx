"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 as SpinnerIcon } from "lucide-react"
import { nanoid } from "nanoid"
import { z } from "zod"

import { UpdatePost } from "../../actions/update-post"

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
import { Form } from "@/components/ui/form"
import MDXEditor from "./mdx-editor"
import { MetadataSidebar } from "./metadata-sidebar"
import { useAutoSave } from "@/hooks/use-auto-save"
import type { Post } from "../page"

export const dynamic = "force-dynamic"

const PostSchema = z.object({
	id: z.string(),
	title: z.string().min(1, "Title is required"),
	slug: z.string().min(1, "Slug is required"),
	image: z.string(),
	content: z.string().min(1, "Content is required"),
})

type PostFormData = z.infer<typeof PostSchema>

const Editor = ({ post }: { post: Post }) => {
	const router = useRouter()

	const [isSaving, setIsSaving] = useState(false)
	const [showLoadingAlert, setShowLoadingAlert] = useState(false)
	const [showDraftAlert, setShowDraftAlert] = useState(false)

	const defaultValues: PostFormData = {
		id: post.id,
		title: post.title ?? "Untitled",
		slug: post.slug ?? `post-${nanoid()}`,
		image: post.image ?? "",
		content: post.content ?? "Type here your blog post content",
	}

	const form = useForm<PostFormData>({
		resolver: zodResolver(PostSchema),
		defaultValues,
		mode: "onChange",
	})

	const watchedValues = form.watch()

	const {
		saveStatus,
		hasDraft,
		draftData,
		restoreDraft,
		clearDraft,
		dismissDraft,
	} = useAutoSave({
		postId: post.id,
		data: {
			title: watchedValues.title,
			slug: watchedValues.slug,
			content: watchedValues.content,
			image: watchedValues.image,
		},
		dbUpdatedAt: post.updatedAt,
	})

	// Show draft restoration dialog on mount if draft exists
	useEffect(() => {
		if (hasDraft && draftData) {
			setShowDraftAlert(true)
		}
	}, [hasDraft, draftData])

	const handleRestoreDraft = () => {
		const draft = restoreDraft()
		if (draft) {
			form.setValue("title", draft.title)
			form.setValue("slug", draft.slug)
			form.setValue("content", draft.content)
			form.setValue("image", draft.image)
			toast.success("Draft restored")
		}
		setShowDraftAlert(false)
	}

	const handleDismissDraft = () => {
		dismissDraft()
		setShowDraftAlert(false)
	}

	async function onSubmit(data: PostFormData) {
		setShowLoadingAlert(true)
		setIsSaving(true)

		const response = await UpdatePost({
			id: post.id,
			title: data.title,
			slug: data.slug,
			image: data.image,
			content: data.content,
		})

		if (response) {
			clearDraft()
			toast.success("Your post has been updated")
			router.push("/private/dashboard/posts?search=refresh")
		} else {
			toast.error("Error updating your post")
		}

		setIsSaving(false)
		setShowLoadingAlert(false)
	}

	const handleContentChange = (newContent: string) => {
		form.setValue("content", newContent, { shouldDirty: true })
	}

	return (
		<>
			<Form {...form}>
				<form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
					<div className="flex flex-col gap-6 lg:flex-row">
						{/* Sidebar */}
						<MetadataSidebar
							form={form}
							postId={post.id}
							saveStatus={saveStatus}
							disabled={isSaving}
						/>

						{/* Main Content */}
						<div className="flex-1 space-y-6">
							<MDXEditor
								content={watchedValues.content}
								onChange={handleContentChange}
							/>

							<div className="flex items-center justify-start gap-3">
								<Button disabled={isSaving} type="submit">
									{isSaving ? (
										<>
											<SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
											Saving...
										</>
									) : (
										"Update Post"
									)}
								</Button>
								<Button
									disabled={isSaving}
									onClick={() => router.back()}
									type="button"
									variant="secondary"
								>
									Cancel
								</Button>
							</div>
						</div>
					</div>
				</form>
			</Form>

			{/* Loading Dialog */}
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

			{/* Draft Restoration Dialog */}
			<AlertDialog open={showDraftAlert} onOpenChange={setShowDraftAlert}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Restore unsaved draft?</AlertDialogTitle>
						<AlertDialogDescription>
							A more recent draft was found for this post. Would you like to
							restore it?
							{draftData && (
								<span className="mt-2 block text-xs">
									Draft saved:{" "}
									{new Date(draftData.savedAt).toLocaleString()}
								</span>
							)}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={handleDismissDraft}>
							Discard Draft
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleRestoreDraft}>
							Restore Draft
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}

export default Editor
