"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { z } from "zod"

import { updateClub } from "../../actions/update-club"

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
import { Separator } from "@/components/ui/separator"
import type { Club } from "@/db/schema/clubs"

const ClubSchema = z.object({
	id: z.number(),
	name: z.string().min(1, "Name is required").max(80),
	logo: z.string().max(500).nullable(),
})

type ClubFormData = z.infer<typeof ClubSchema>

interface ClubEditorProps {
	club: Club
}

export function ClubEditor({ club }: ClubEditorProps) {
	const router = useRouter()
	const [isSaving, setIsSaving] = useState(false)

	const defaultValues: ClubFormData = {
		id: club.id,
		name: club.name,
		logo: club.logo ?? null,
	}

	const form = useForm<ClubFormData>({
		resolver: zodResolver(ClubSchema),
		defaultValues,
	})

	async function onSubmit(data: ClubFormData) {
		setIsSaving(true)

		const result = await updateClub({
			id: data.id,
			name: data.name,
			logo: data.logo,
		})

		if (result.success) {
			toast.success("Club updated successfully")
			router.refresh()
		} else {
			toast.error(result.error || "Failed to update club")
		}

		setIsSaving(false)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<Card className="max-w-2xl">
					<CardHeader>
						<CardTitle>Club Information</CardTitle>
						<CardDescription>Update club details. ID: {club.id}</CardDescription>
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
											placeholder="Club name"
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
							name="logo"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Logo URL</FormLabel>
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
							"Update Club"
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
