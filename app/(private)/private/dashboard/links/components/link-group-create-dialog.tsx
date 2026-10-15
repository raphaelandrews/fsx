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
import { createLinkGroup } from "../actions/create-link-group"

const CreateLinkGroupSchema = z.object({
	label: z.string().min(1, "Label is required").max(50),
})

type CreateLinkGroupFormData = z.infer<typeof CreateLinkGroupSchema>

export function LinkGroupCreateDialog() {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const [isCreating, setIsCreating] = useState(false)

	const form = useForm<CreateLinkGroupFormData>({
		resolver: zodResolver(CreateLinkGroupSchema),
		defaultValues: {
			label: "",
		},
	})

	async function onSubmit(data: CreateLinkGroupFormData) {
		setIsCreating(true)

		const result = await createLinkGroup({
			label: data.label,
		})

		if (result.success && result.data) {
			toast.success("Link group created successfully")
			setOpen(false)
			form.reset()
			router.refresh()
		} else {
			toast.error(result.error || "Failed to create link group")
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
					<DialogTitle>Create Link Group</DialogTitle>
					<DialogDescription>
						Create a new link group. You can add links to it after creation.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="label"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Label</FormLabel>
									<FormControl>
										<Input
											placeholder="Group label"
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
									"Create Link Group"
								)}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
