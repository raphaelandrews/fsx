"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { z } from "zod"

import { updateAnnouncement } from "../../actions/update-announcement"

import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import type { Announcement } from "@/db/schema/announcements"

const AnnouncementSchema = z.object({
	id: z.number(),
	year: z.coerce.number().min(2000).max(2100),
	number: z.string().min(1, "Number is required").max(3),
	content: z.string().min(1, "Content is required"),
})

type AnnouncementFormData = z.infer<typeof AnnouncementSchema>

interface AnnouncementEditorProps {
	announcement: Announcement
}

export function AnnouncementEditor({ announcement }: AnnouncementEditorProps) {
	const router = useRouter()
	const [isSaving, setIsSaving] = useState(false)

	const defaultValues: AnnouncementFormData = {
		id: announcement.id,
		year: announcement.year,
		number: announcement.number,
		content: announcement.content,
	}

	const form = useForm<AnnouncementFormData>({
		resolver: zodResolver(AnnouncementSchema),
		defaultValues,
	})

	async function onSubmit(data: AnnouncementFormData) {
		setIsSaving(true)

		const result = await updateAnnouncement({
			id: data.id,
			year: data.year,
			number: data.number,
			content: data.content,
		})

		if (result.success) {
			toast.success("Announcement updated successfully")
			router.refresh()
		} else {
			toast.error(result.error || "Failed to update announcement")
		}

		setIsSaving(false)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<Card className="max-w-2xl">
					<CardHeader>
						<CardTitle>Announcement Information</CardTitle>
						<CardDescription>
							Update announcement details. ID: {announcement.id}
						</CardDescription>
					</CardHeader>
					<Separator className="mb-6" />
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="year"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Year</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="2024"
												disabled={isSaving}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="number"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Number</FormLabel>
										<FormControl>
											<Input
												placeholder="001"
												maxLength={3}
												disabled={isSaving}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="content"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Content</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Announcement content..."
											rows={8}
											disabled={isSaving}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
				</Card>

				<div className="flex items-center gap-3">
					<Button type="submit" disabled={isSaving}>
						{isSaving ? (
							<>
								<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
								Saving...
							</>
						) : (
							"Update Announcement"
						)}
					</Button>
					<Button
						type="button"
						variant="secondary"
						disabled={isSaving}
						onClick={() => router.back()}
					>
						Cancel
					</Button>
				</div>
			</form>
		</Form>
	)
}
