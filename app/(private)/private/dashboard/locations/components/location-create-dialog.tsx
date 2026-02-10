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
import { createLocation } from "../actions/create-location"

const CreateLocationSchema = z.object({
	name: z.string().min(1, "Name is required").max(80),
	type: z.enum(["city", "state", "country"]),
	flag: z.string().max(500).optional(),
})

type CreateLocationFormData = z.infer<typeof CreateLocationSchema>

export function LocationCreateDialog() {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [isCreating, setIsCreating] = useState(false)

	const form = useForm<CreateLocationFormData>({
		resolver: zodResolver(CreateLocationSchema),
		defaultValues: {
			name: "",
			type: "city",
			flag: "",
		},
	})

	async function onSubmit(data: CreateLocationFormData) {
		setIsCreating(true)

		const result = await createLocation({
			name: data.name,
			type: data.type,
			flag: data.flag || null,
		})

		if (result.success && result.data) {
			toast.success("Location created successfully")
			setOpen(false)
			form.reset()
			router.refresh()
		} else {
			toast.error(result.error || "Failed to create location")
		}

		setIsCreating(false)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm" className="h-8">
					<PlusIcon className="mr-2 h-4 w-4" />
					New
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create Location</DialogTitle>
					<DialogDescription>
						Create a new location.
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
											placeholder="Location name"
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
											<SelectItem value="city">City</SelectItem>
											<SelectItem value="state">State</SelectItem>
											<SelectItem value="country">Country</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="flag"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Flag URL</FormLabel>
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
									"Create Location"
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
