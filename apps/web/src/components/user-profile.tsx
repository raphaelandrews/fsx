"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import { Mail01Icon, Calendar01Icon, UserIcon } from "@hugeicons/core-free-icons"

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@fsx/ui/components/card"
import { Avatar, AvatarFallback, AvatarImage } from "@fsx/ui/components/avatar"
import { Badge } from "@fsx/ui/components/badge"

interface UserProfileProps {
	user: {
		id: string
		email: string
		name?: string
		image?: string | null
		createdAt: Date
	}
}

export function UserProfile({ user }: UserProfileProps) {
	const createdAt = new Date(user.createdAt).toLocaleDateString()

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Profile Information</CardTitle>
					<CardDescription>Your account details from GitHub</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-start space-x-4">
						<Avatar className="h-16 w-16">
							<AvatarImage
								alt={user.name || "User"}
								src={user.image || "/placeholder.svg"}
							/>
							<AvatarFallback>
								<HugeiconsIcon className="h-8 w-8" icon={UserIcon} />
							</AvatarFallback>
						</Avatar>
						<div className="space-y-2">
							<div>
								<h3 className="font-semibold text-lg">
									{user.name || "No name provided"}
								</h3>
								<p className="text-gray-600 text-sm">
									@{user.email.split("@")[0] || "No username"}
								</p>
							</div>
							<div className="flex items-center space-x-2 text-gray-600 text-sm">
								<HugeiconsIcon className="h-4 w-4" icon={Mail01Icon} />
								<span>{user.email}</span>
							</div>
							<div className="flex items-center space-x-2 text-gray-600 text-sm">
								<HugeiconsIcon className="h-4 w-4" icon={Calendar01Icon} />
								<span>Joined {createdAt}</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Account Details</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label
								className="font-medium text-gray-700 text-sm"
								htmlFor="user-id"
							>
								User ID
							</label>
							<p className="rounded bg-gray-100 p-2 font-mono text-gray-900 text-sm">
								{user.id}
							</p>
						</div>
						<div>
							<label
								className="font-medium text-gray-700 text-sm"
								htmlFor="provider"
							>
								Provider
							</label>
							<div className="mt-1">
								<Badge variant="secondary">GitHub</Badge>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
