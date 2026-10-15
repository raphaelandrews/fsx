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
import { createClub } from "../actions/create-club"

const CreateClubSchema = z.object({
	name: z.string().min(1, "Name is required").max(80),
	logo: z.string().max(500).optional(),
})

type CreateClubFormData = z.infer<typeof CreateClubSchema>

export function ClubCreateDialog() {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [isCreating, setIsCreating] = useState(false)

	const form = useForm<CreateClubFormData>({
		resolver: zodResolver(CreateClubSchema),
		defaultValues: {
			name: "",
			logo: "",
		},
	})

	async function onSubmit(data: CreateClubFormData) {
		setIsCreating(true)

		const result = await createClub({
			name: data.name,
			logo: data.logo || null,
		})

		if (result.success && result.data) {
			toast.success("Club created successfully")
			setOpen(false)
			form.reset()
			router.refresh()
		} else {
			toast.error(result.error || "Failed to create club")
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
					<DialogTitle>Create Club</DialogTitle>
					<DialogDescription>
						Create a new chess club.
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
											placeholder="Club name"
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
							name="logo"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Logo URL</FormLabel>
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
									"Create Club"
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
