"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon, PlusIcon, TrashIcon, GripVerticalIcon } from "lucide-react"
import { z } from "zod"

import { updateLinkGroup } from "../../actions/update-link-group"
import { createLink } from "../../actions/create-link"
import { updateLink } from "../../actions/update-link"
import { deleteLink } from "../../actions/delete-link"

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
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { LinkGroup } from "@/db/schema/linkGroups"
import type { Link } from "@/db/schema/links"

const LinkGroupSchema = z.object({
	id: z.number(),
	label: z.string().min(1, "Label is required").max(50),
})

const svgSchema = z
	.string()
	.min(1, "Icon is required")
	.refine(
		(value) => {
			const trimmed = value.trim()
			return trimmed.startsWith("<svg") && trimmed.endsWith("</svg>")
		},
		{ message: "Must be a valid SVG (starts with <svg and ends with </svg>)" }
	)

const LinkSchema = z.object({
	id: z.number().optional(),
	href: z
		.string()
		.min(1, "URL is required")
		.url("Must be a valid URL")
		.refine(
			(value) => {
				try {
					const url = new URL(value)
					return url.protocol === "http:" || url.protocol === "https:"
				} catch {
					return false
				}
			},
			{ message: "Must be a valid HTTP or HTTPS URL" }
		),
	label: z.string().min(1, "Label is required").max(50),
	icon: svgSchema,
	order: z.number().int().positive(),
})

type LinkGroupFormData = z.infer<typeof LinkGroupSchema>
type LinkFormData = z.infer<typeof LinkSchema>

interface LinkGroupWithLinks extends LinkGroup {
	links: Link[]
}

interface LinkGroupEditorProps {
	linkGroup: LinkGroupWithLinks
}

export function LinkGroupEditor({ linkGroup }: LinkGroupEditorProps) {
	const router = useRouter()
	const [isSaving, setIsSaving] = useState(false)
	const [links, setLinks] = useState<Link[]>(linkGroup.links)
	const [editingLink, setEditingLink] = useState<Link | null>(null)
	const [isCreatingLink, setIsCreatingLink] = useState(false)
	const [linkToDelete, setLinkToDelete] = useState<Link | null>(null)
	const [isDeletingLink, setIsDeletingLink] = useState(false)
	const [isSavingLink, setIsSavingLink] = useState(false)

	const defaultValues: LinkGroupFormData = {
		id: linkGroup.id,
		label: linkGroup.label,
	}

	const form = useForm<LinkGroupFormData>({
		resolver: zodResolver(LinkGroupSchema),
		defaultValues,
	})

	const linkForm = useForm<LinkFormData>({
		resolver: zodResolver(LinkSchema),
		defaultValues: {
			href: "",
			label: "",
			icon: "",
			order: links.length + 1,
		},
	})

	async function onSubmit(data: LinkGroupFormData) {
		setIsSaving(true)

		const result = await updateLinkGroup({
			id: data.id,
			label: data.label,
		})

		if (result.success) {
			toast.success("Link group updated successfully")
			router.refresh()
		} else {
			toast.error(result.error || "Failed to update link group")
		}

		setIsSaving(false)
	}

	async function onLinkSubmit(data: LinkFormData) {
		setIsSavingLink(true)

		if (editingLink) {
			const result = await updateLink({
				id: editingLink.id,
				href: data.href,
				label: data.label,
				icon: data.icon,
				order: data.order,
			})

			if (result.success && result.data) {
				toast.success("Link updated successfully")
				setLinks(links.map(l => l.id === editingLink.id ? result.data : l))
				setEditingLink(null)
				linkForm.reset({ href: "", label: "", icon: "", order: links.length + 1 })
				router.refresh()
			} else {
				toast.error(result.error || "Failed to update link")
			}
		} else {
			const result = await createLink({
				href: data.href,
				label: data.label,
				icon: data.icon,
				order: data.order,
				linkGroupId: linkGroup.id,
			})

			if (result.success && result.data) {
				toast.success("Link created successfully")
				setLinks([...links, result.data])
				setIsCreatingLink(false)
				linkForm.reset({ href: "", label: "", icon: "", order: links.length + 2 })
				router.refresh()
			} else {
				toast.error(result.error || "Failed to create link")
			}
		}

		setIsSavingLink(false)
	}

	async function handleDeleteLink() {
		if (!linkToDelete) return

		setIsDeletingLink(true)
		const result = await deleteLink(linkToDelete.id)

		if (result.success) {
			toast.success("Link deleted successfully")
			setLinks(links.filter(l => l.id !== linkToDelete.id))
			router.refresh()
		} else {
			toast.error(result.error || "Failed to delete link")
		}

		setIsDeletingLink(false)
		setLinkToDelete(null)
	}

	function startEditingLink(link: Link) {
		setEditingLink(link)
		setIsCreatingLink(false)
		linkForm.reset({
			id: link.id,
			href: link.href,
			label: link.label,
			icon: link.icon,
			order: link.order,
		})
	}

	function cancelLinkEdit() {
		setEditingLink(null)
		setIsCreatingLink(false)
		linkForm.reset({ href: "", label: "", icon: "", order: links.length + 1 })
	}

	return (
		<div className="space-y-6">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<Card className="max-w-2xl">
						<CardHeader>
							<CardTitle>Link Group Information</CardTitle>
							<CardDescription>Update link group details. ID: {linkGroup.id}</CardDescription>
						</CardHeader>
						<Separator className="mb-6" />
						<CardContent className="space-y-4">
							<FormField
								control={form.control}
								name="label"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Label</FormLabel>
										<FormControl>
											<Input
												placeholder="Group label"
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
								"Update Link Group"
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

			<Card className="max-w-2xl">
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Links</CardTitle>
						<CardDescription>Manage links in this group</CardDescription>
					</div>
					{!isCreatingLink && !editingLink && (
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								setIsCreatingLink(true)
								linkForm.reset({ href: "", label: "", icon: "", order: links.length + 1 })
							}}
						>
							<PlusIcon className="mr-2 h-4 w-4" />
							Add Link
						</Button>
					)}
				</CardHeader>
				<Separator className="mb-6" />
				<CardContent className="space-y-4">
					{links.length === 0 && !isCreatingLink && (
						<p className="text-sm text-muted-foreground text-center py-4">
							No links yet. Click "Add Link" to create one.
						</p>
					)}

					{links.map((link) => (
						<div
							key={link.id}
							className={`flex items-center gap-3 p-3 rounded-md border ${
								editingLink?.id === link.id ? "border-primary bg-muted/50" : ""
							}`}
						>
							<GripVerticalIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
							<div
								className="h-5 w-5 flex-shrink-0 [&>svg]:h-full [&>svg]:w-full"
								dangerouslySetInnerHTML={{ __html: link.icon }}
							/>
							<div className="flex-1 min-w-0">
								<span className="text-sm font-medium truncate block">{link.label}</span>
								<p className="text-xs text-muted-foreground truncate">{link.href}</p>
							</div>
							<span className="text-xs text-muted-foreground flex-shrink-0">#{link.order}</span>
							<div className="flex items-center gap-1 flex-shrink-0">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => startEditingLink(link)}
									disabled={editingLink !== null || isCreatingLink}
								>
									Edit
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="text-destructive hover:text-destructive"
									onClick={() => setLinkToDelete(link)}
									disabled={editingLink !== null || isCreatingLink}
								>
									<TrashIcon className="h-4 w-4" />
								</Button>
							</div>
						</div>
					))}

					{(isCreatingLink || editingLink) && (
						<Form {...linkForm}>
							<form onSubmit={linkForm.handleSubmit(onLinkSubmit)} className="space-y-4 p-4 border rounded-md bg-muted/30">
								<h4 className="font-medium text-sm">
									{editingLink ? "Edit Link" : "New Link"}
								</h4>

								<FormField
									control={linkForm.control}
									name="label"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Label</FormLabel>
											<FormControl>
												<Input
													placeholder="Link label"
													disabled={isSavingLink}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={linkForm.control}
									name="icon"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Icon (SVG)</FormLabel>
											<FormControl>
												<Textarea
													placeholder="<svg>...</svg>"
													disabled={isSavingLink}
													className="font-mono text-xs min-h-[100px]"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={linkForm.control}
									name="href"
									render={({ field }) => (
										<FormItem>
											<FormLabel>URL</FormLabel>
											<FormControl>
												<Input
													placeholder="https://..."
													disabled={isSavingLink}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={linkForm.control}
									name="order"
									render={({ field }) => (
										<FormItem className="max-w-[120px]">
											<FormLabel>Order</FormLabel>
											<FormControl>
												<Input
													type="number"
													min={1}
													disabled={isSavingLink}
													{...field}
													onChange={(e) => field.onChange(Number(e.target.value))}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="flex items-center gap-3 pt-2">
									<Button type="submit" size="sm" disabled={isSavingLink}>
										{isSavingLink ? (
											<>
												<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
												Saving...
											</>
										) : editingLink ? (
											"Update Link"
										) : (
											"Create Link"
										)}
									</Button>
									<Button
										type="button"
										variant="secondary"
										size="sm"
										disabled={isSavingLink}
										onClick={cancelLinkEdit}
									>
										Cancel
									</Button>
								</div>
							</form>
						</Form>
					)}
				</CardContent>
			</Card>

			<AlertDialog open={linkToDelete !== null} onOpenChange={(open) => !open && setLinkToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the link
							"{linkToDelete?.label}".
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeletingLink}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteLink}
							disabled={isDeletingLink}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeletingLink ? (
								<>
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
									Deleting...
								</>
							) : (
								"Delete"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}
