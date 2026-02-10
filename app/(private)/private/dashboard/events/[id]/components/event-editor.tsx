"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { z } from "zod"

import { updateEvent } from "../../actions/update-event"

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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { Event } from "@/db/schema/events"

const EventSchema = z.object({
	id: z.number(),
	name: z.string().min(1, "Name is required").max(80),
	chessResults: z.string().max(500).nullable(),
	startDate: z.string().min(1, "Start date is required"),
	endDate: z.string().nullable(),
	regulation: z.string().max(500).nullable(),
	form: z.string().max(500).nullable(),
	type: z.enum(["open", "closed", "school"]),
	timeControl: z.enum(["standard", "rapid", "blitz", "bullet"]),
})

type EventFormData = z.infer<typeof EventSchema>

interface EventEditorProps {
	event: Event
}

export function EventEditor({ event }: EventEditorProps) {
	const router = useRouter()
	const [isSaving, setIsSaving] = useState(false)

	const defaultValues: EventFormData = {
		id: event.id,
		name: event.name,
		chessResults: event.chessResults ?? null,
		startDate: event.startDate
			? new Date(event.startDate).toISOString().split("T")[0]
			: "",
		endDate: event.endDate
			? new Date(event.endDate).toISOString().split("T")[0]
			: null,
		regulation: event.regulation ?? null,
		form: event.form ?? null,
		type: event.type,
		timeControl: event.timeControl,
	}

	const form = useForm<EventFormData>({
		resolver: zodResolver(EventSchema),
		defaultValues,
	})

	async function onSubmit(data: EventFormData) {
		setIsSaving(true)

		const result = await updateEvent({
			id: data.id,
			name: data.name,
			chessResults: data.chessResults,
			startDate: new Date(data.startDate),
			endDate: data.endDate ? new Date(data.endDate) : null,
			regulation: data.regulation,
			form: data.form,
			type: data.type,
			timeControl: data.timeControl,
		})

		if (result.success) {
			toast.success("Event updated successfully")
			router.refresh()
		} else {
			toast.error(result.error || "Failed to update event")
		}

		setIsSaving(false)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<Card className="max-w-2xl">
					<CardHeader>
						<CardTitle>Event Information</CardTitle>
						<CardDescription>Update event details. ID: {event.id}</CardDescription>
					</CardHeader>
					<Separator className="mb-6" />
					<CardContent className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input
											placeholder="Event name"
											disabled={isSaving}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="startDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Start Date</FormLabel>
										<FormControl>
											<Input type="date" disabled={isSaving} {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="endDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>End Date</FormLabel>
										<FormControl>
											<Input
												type="date"
												disabled={isSaving}
												{...field}
												value={field.value ?? ""}
												onChange={(e) =>
													field.onChange(e.target.value || null)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Type</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
											disabled={isSaving}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="open">Open</SelectItem>
												<SelectItem value="closed">Closed</SelectItem>
												<SelectItem value="school">School</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="timeControl"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Time Control</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
											disabled={isSaving}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select time control" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="standard">Standard</SelectItem>
												<SelectItem value="rapid">Rapid</SelectItem>
												<SelectItem value="blitz">Blitz</SelectItem>
												<SelectItem value="bullet">Bullet</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="chessResults"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Chess Results URL</FormLabel>
									<FormControl>
										<Input
											placeholder="https://chess-results.com/..."
											disabled={isSaving}
											{...field}
											value={field.value ?? ""}
											onChange={(e) =>
												field.onChange(e.target.value || null)
											}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="regulation"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Regulation URL</FormLabel>
									<FormControl>
										<Input
											placeholder="https://..."
											disabled={isSaving}
											{...field}
											value={field.value ?? ""}
											onChange={(e) =>
												field.onChange(e.target.value || null)
											}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="form"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Registration Form URL</FormLabel>
									<FormControl>
										<Input
											placeholder="https://..."
											disabled={isSaving}
											{...field}
											value={field.value ?? ""}
											onChange={(e) =>
												field.onChange(e.target.value || null)
											}
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
							"Update Event"
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
