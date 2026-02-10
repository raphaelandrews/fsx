"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { z } from "zod"

import { updatePlayer } from "../../actions/update-player"

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
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SearchableSelect } from "./searchable-select"
import { AvatarUpload } from "./avatar-upload"
import type { PlayerForEdit } from "@/db/queries/player-for-edit/queries"
import type { ClubOption } from "@/db/queries/clubs/queries"
import type { LocationOption } from "@/db/queries/locations/queries"

const PlayerSchema = z.object({
	id: z.number(),
	name: z.string().min(1, "Name is required").max(100),
	imageUrl: z.string().max(500).nullable(),
	cbxId: z.coerce.number().nullable(),
	fideId: z.coerce.number().nullable(),
	birth: z.string().nullable(),
	sex: z.boolean(),
	clubId: z.number().nullable(),
	locationId: z.number().nullable(),
})

type PlayerFormData = z.infer<typeof PlayerSchema>

interface PlayerEditorProps {
	player: NonNullable<PlayerForEdit>
	clubs: ClubOption[]
	locations: LocationOption[]
}

export function PlayerEditor({ player, clubs, locations }: PlayerEditorProps) {
	const router = useRouter()
	const [isSaving, setIsSaving] = useState(false)

	const defaultValues: PlayerFormData = {
		id: player.id,
		name: player.name,
		imageUrl: player.imageUrl ?? null,
		cbxId: player.cbxId ?? null,
		fideId: player.fideId ?? null,
		birth: player.birth ? player.birth.toISOString().split("T")[0] : null,
		sex: player.sex ?? false,
		clubId: player.clubId ?? null,
		locationId: player.locationId ?? null,
	}

	const form = useForm<PlayerFormData>({
		resolver: zodResolver(PlayerSchema),
		defaultValues,
	})

	async function onSubmit(data: PlayerFormData) {
		setIsSaving(true)

		const result = await updatePlayer({
			id: data.id,
			name: data.name,
			imageUrl: data.imageUrl,
			cbxId: data.cbxId,
			fideId: data.fideId,
			birth: data.birth ? new Date(data.birth) : null,
			sex: data.sex,
			clubId: data.clubId,
			locationId: data.locationId,
		})

		if (result.success) {
			toast.success("Player updated successfully")
			router.refresh()
		} else {
			toast.error(result.error || "Failed to update player")
		}

		setIsSaving(false)
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<Card className="max-w-2xl">
					<CardHeader>
						<CardTitle>Player Information</CardTitle>
						<CardDescription>
							Update player details. ID: {player.id}
						</CardDescription>
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
											placeholder="Player name"
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
							name="imageUrl"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Avatar</FormLabel>
									<FormControl>
										<AvatarUpload
											playerId={player.id}
											value={field.value}
											onChange={field.onChange}
											disabled={isSaving}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="cbxId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>CBX ID</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="CBX ID"
												disabled={isSaving}
												{...field}
												value={field.value ?? ""}
												onChange={(e) =>
													field.onChange(
														e.target.value ? Number(e.target.value) : null
													)
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="fideId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>FIDE ID</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="FIDE ID"
												disabled={isSaving}
												{...field}
												value={field.value ?? ""}
												onChange={(e) =>
													field.onChange(
														e.target.value ? Number(e.target.value) : null
													)
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
								name="birth"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Birth Date</FormLabel>
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

							<FormField
								control={form.control}
								name="sex"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Sex</FormLabel>
										<FormControl>
											<div className="flex gap-4 pt-2">
												<label className="flex items-center gap-2">
													<input
														type="radio"
														checked={!field.value}
														onChange={() => field.onChange(false)}
														disabled={isSaving}
													/>
													Male
												</label>
												<label className="flex items-center gap-2">
													<input
														type="radio"
														checked={field.value}
														onChange={() => field.onChange(true)}
														disabled={isSaving}
													/>
													Female
												</label>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="clubId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Club</FormLabel>
									<FormControl>
										<SearchableSelect
											options={clubs}
											value={field.value}
											onChange={field.onChange}
											placeholder="Select club..."
											searchPlaceholder="Search clubs..."
											emptyMessage="No clubs found."
											disabled={isSaving}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="locationId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Location</FormLabel>
									<FormControl>
										<SearchableSelect
											options={locations}
											value={field.value}
											onChange={field.onChange}
											placeholder="Select location..."
											searchPlaceholder="Search locations..."
											emptyMessage="No locations found."
											disabled={isSaving}
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
							"Update Player"
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
