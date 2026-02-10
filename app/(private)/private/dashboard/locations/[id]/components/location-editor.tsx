"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { z } from "zod"

import { updateLocation } from "../../actions/update-location"

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
import type { Location } from "@/db/schema/locations"

const LocationSchema = z.object({
	id: z.number(),
	name: z.string().min(1, "Name is required").max(80),
	type: z.enum(["city", "state", "country"]),
	flag: z.string().max(500).nullable(),
})

type LocationFormData = z.infer<typeof LocationSchema>

interface LocationEditorProps {
	location: Location
}

export function LocationEditor({ location }: LocationEditorProps) {
	const router = useRouter()
	const [isSaving, setIsSaving] = useState(false)

	const defaultValues: LocationFormData = {
		id: location.id,
		name: location.name,
		type: location.type,
		flag: location.flag ?? null,
	}

	const form = useForm<LocationFormData>({
		resolver: zodResolver(LocationSchema),
		defaultValues,
	})

	async function onSubmit(data: LocationFormData) {
		setIsSaving(true)

		const result = await updateLocation({
			id: data.id,
			name: data.name,
			type: data.type,
			flag: data.flag,
		})

		if (result.success) {
			toast.success("Location updated successfully")
			router.refresh()
		} else {
			toast.error(result.error || "Failed to update location")
		}

		setIsSaving(false)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<Card className="max-w-2xl">
					<CardHeader>
						<CardTitle>Location Information</CardTitle>
						<CardDescription>Update location details. ID: {location.id}</CardDescription>
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
											placeholder="Location name"
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
							"Update Location"
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
