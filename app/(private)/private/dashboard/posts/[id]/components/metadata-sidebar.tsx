"use client"

import { useEffect } from "react"
import { UseFormReturn } from "react-hook-form"
import { CheckIcon, Loader2Icon } from "lucide-react"
import slugify from "react-slugify"

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ImageUpload } from "./image-upload"
import type { SaveStatus } from "@/hooks/use-auto-save"
import { cn } from "@/lib/utils"

interface MetadataSidebarProps {
	form: UseFormReturn<{
		id: string
		title: string
		slug: string
		image: string
		content: string
	}>
	postId: string
	saveStatus: SaveStatus
	disabled?: boolean
}

function SaveStatusIndicator({ status }: { status: SaveStatus }) {
	return (
		<div className="flex items-center gap-2 text-sm">
			{status === "saving" && (
				<>
					<Loader2Icon className="h-4 w-4 animate-spin text-muted-foreground" />
					<span className="text-muted-foreground">Saving draft...</span>
				</>
			)}
			{status === "saved" && (
				<>
					<CheckIcon className="h-4 w-4 text-green-500" />
					<span className="text-green-500">Draft saved</span>
				</>
			)}
			{status === "idle" && (
				<span className="text-muted-foreground">Auto-save enabled</span>
			)}
		</div>
	)
}

export function MetadataSidebar({
	form,
	postId,
	saveStatus,
	disabled = false,
}: MetadataSidebarProps) {
	const title = form.watch("title")

	useEffect(() => {
		if (title) {
			const newSlug = slugify(title)
			form.setValue("slug", newSlug, { shouldDirty: true })
		}
	}, [title, form])

	return (
		<div className="flex w-full flex-col gap-4 lg:w-80">
			{/* Save Status Card */}
			<Card>
				<CardHeader className="py-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-sm font-medium">Status</CardTitle>
						<div
							className={cn(
								"h-2 w-2 rounded-full",
								saveStatus === "saving" && "animate-pulse bg-yellow-500",
								saveStatus === "saved" && "bg-green-500",
								saveStatus === "idle" && "bg-muted-foreground/50"
							)}
						/>
					</div>
				</CardHeader>
				<CardContent className="pt-0">
					<SaveStatusIndicator status={saveStatus} />
				</CardContent>
			</Card>

			{/* Cover Image Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium">Cover Image</CardTitle>
					<CardDescription>
						Upload a cover image for your post (16:9)
					</CardDescription>
				</CardHeader>
				<CardContent>
					<FormField
						control={form.control}
						name="image"
						render={({ field }) => (
							<FormItem>
								<FormControl>
									<ImageUpload
										postId={postId}
										value={field.value}
										onChange={field.onChange}
										disabled={disabled}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</CardContent>
			</Card>

			{/* Metadata Card */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm font-medium">Metadata</CardTitle>
					<CardDescription>Post title and URL slug</CardDescription>
				</CardHeader>
				<Separator className="mb-4" />
				<CardContent className="space-y-4">
					<FormField
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Title</FormLabel>
								<FormControl>
									<Input
										placeholder="Enter post title"
										disabled={disabled}
										{...field}
										onChange={(e) => {
											const sanitized = e.target.value
												.trimStart()
												.replace(/\s{2,}/g, " ")
											field.onChange(sanitized)
										}}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="slug"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Slug</FormLabel>
								<FormControl>
									<Input
										placeholder="post-url-slug"
										disabled
										readOnly
										className="bg-muted"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</CardContent>
			</Card>
		</div>
	)
}
