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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { createEvent } from "../actions/create-event"

const CreateEventSchema = z.object({
	name: z.string().min(1, "Name is required").max(80),
	startDate: z.date({
		required_error: "Start date is required",
	}),
	endDate: z.date().optional(),
	type: z.enum(["open", "closed", "school"]),
	timeControl: z.enum(["standard", "rapid", "blitz", "bullet"]),
	chessResults: z.string().max(500).optional(),
	regulation: z.string().max(500).optional(),
	form: z.string().max(500).optional(),
}).refine(
	(data) => {
		if (!data.endDate) return true
		return data.endDate >= data.startDate
	},
	{
		message: "End date must be after start date",
		path: ["endDate"],
	},
)

type CreateEventFormData = z.infer<typeof CreateEventSchema>

import { DateTimePicker } from "@/components/ui/date-time-picker"

export function EventCreateDialog() {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [isCreating, setIsCreating] = useState(false)

	const form = useForm<CreateEventFormData>({
		resolver: zodResolver(CreateEventSchema),
		defaultValues: {
			name: "",
			startDate: new Date(),
			endDate: undefined,
			type: "open",
			timeControl: "rapid",
			chessResults: "",
			regulation: "",
			form: "",
		},
	})

	async function onSubmit(data: CreateEventFormData) {
		setIsCreating(true)

		const result = await createEvent({
			name: data.name,
			startDate: data.startDate,
			endDate: data.endDate || null,
			type: data.type,
			timeControl: data.timeControl,
			chessResults: data.chessResults || null,
			regulation: data.regulation || null,
			form: data.form || null,
		})

		if (result.success && result.data) {
			toast.success("Event created successfully")
			setOpen(false)
			form.reset()
			router.push(`/private/dashboard/events/${result.data.id}`)
		} else {
			toast.error(result.error || "Failed to create event")
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
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Create Event</DialogTitle>
					<DialogDescription>
						Create a new chess event with all details.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input
											placeholder="Event name"
											disabled={isCreating}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex flex-col gap-4">
							<FormField
								control={form.control}
								name="startDate"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Start Date</FormLabel>
										<FormControl>
											<DateTimePicker
												date={field.value}
												setDate={field.onChange}
												disabled={isCreating}
											/>
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
											<DateTimePicker
												date={field.value}
												setDate={field.onChange}
												disabled={isCreating}
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
											disabled={isCreating}
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
											disabled={isCreating}
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
							name="regulation"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Regulation URL</FormLabel>
									<FormControl>
										<Input
											placeholder="https://..."
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
							name="form"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Registration Form URL</FormLabel>
									<FormControl>
										<Input
											placeholder="https://..."
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
									"Create Event"
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
