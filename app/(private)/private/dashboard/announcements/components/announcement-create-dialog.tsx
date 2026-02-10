"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { PlusIcon, Loader2Icon } from "lucide-react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
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
import { createAnnouncement } from "../actions/create-announcement"

const CreateAnnouncementSchema = z.object({
	year: z.coerce.number().min(2000).max(2100),
	number: z.string().min(1, "Number is required").max(3),
	content: z.string().min(1, "Content is required"),
})

type CreateAnnouncementFormData = z.infer<typeof CreateAnnouncementSchema>

export function AnnouncementCreateDialog() {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [isCreating, setIsCreating] = useState(false)

	const currentYear = new Date().getFullYear()

	const form = useForm<CreateAnnouncementFormData>({
		resolver: zodResolver(CreateAnnouncementSchema),
		defaultValues: {
			year: currentYear,
			number: "",
			content: "",
		},
	})

	async function onSubmit(data: CreateAnnouncementFormData) {
		setIsCreating(true)

		const result = await createAnnouncement({
			year: data.year,
			number: data.number,
			content: data.content,
		})

		if (result.success && result.data) {
			toast.success("Announcement created successfully")
			setOpen(false)
			form.reset()
			router.push(`/private/dashboard/announcements/${result.data.id}`)
		} else {
			toast.error(result.error || "Failed to create announcement")
		}

		setIsCreating(false)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline">
					<PlusIcon className="mr-2 h-4 w-4" />
					New
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Announcement</DialogTitle>
					<DialogDescription>
						Create a new announcement.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
												disabled={isCreating}
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
												disabled={isCreating}
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
											rows={4}
											disabled={isCreating}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex justify-end gap-3 pt-4">
							<Button
								type="button"
								variant="secondary"
								onClick={() => setOpen(false)}
								disabled={isCreating}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isCreating}>
								{isCreating ? (
									<>
										<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
										Creating...
									</>
								) : (
									"Create Announcement"
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
