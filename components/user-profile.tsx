import type { User } from "@supabase/supabase-js"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Mail, UserIcon } from "lucide-react"

interface UserProfileProps {
	user: User
}

export function UserProfile({ user }: UserProfileProps) {
	const userMetadata = user.user_metadata
	const createdAt = new Date(user.created_at).toLocaleDateString()

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
								alt={userMetadata?.full_name || "User"}
								src={userMetadata?.avatar_url || "/placeholder.svg"}
							/>
							<AvatarFallback>
								<UserIcon className="h-8 w-8" />
							</AvatarFallback>
						</Avatar>
						<div className="space-y-2">
							<div>
								<h3 className="font-semibold text-lg">
									{userMetadata?.full_name || "No name provided"}
								</h3>
								<p className="text-gray-600 text-sm">
									@{userMetadata?.user_name || "No username"}
								</p>
							</div>
							<div className="flex items-center space-x-2 text-gray-600 text-sm">
								<Mail className="h-4 w-4" />
								<span>{user.email}</span>
							</div>
							<div className="flex items-center space-x-2 text-gray-600 text-sm">
								<CalendarDays className="h-4 w-4" />
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
						<div>
							<label
								className="font-medium text-gray-700 text-sm"
								htmlFor="last-sign-in"
							>
								Last Sign In
							</label>
							<p className="text-gray-900 text-sm">
								{new Date(user.last_sign_in_at || "").toLocaleString()}
							</p>
						</div>
						<div>
							<label
								className="font-medium text-gray-700 text-sm"
								htmlFor="email-confirmed"
							>
								Email Confirmed
							</label>
							<div className="mt-1">
								<Badge
									variant={user.email_confirmed_at ? "default" : "destructive"}
								>
									{user.email_confirmed_at ? "Confirmed" : "Not Confirmed"}
								</Badge>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
