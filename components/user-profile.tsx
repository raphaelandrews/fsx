import type { User } from "@supabase/supabase-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Mail, UserIcon } from "lucide-react";

interface UserProfileProps {
  user: User;
}

export function UserProfile({ user }: UserProfileProps) {
  const userMetadata = user.user_metadata;
  const createdAt = new Date(user.created_at).toLocaleDateString();

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
                src={userMetadata?.avatar_url || "/placeholder.svg"}
                alt={userMetadata?.full_name || "User"}
              />
              <AvatarFallback>
                <UserIcon className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div>
                <h3 className="text-lg font-semibold">
                  {userMetadata?.full_name || "No name provided"}
                </h3>
                <p className="text-sm text-gray-600">
                  @{userMetadata?.user_name || "No username"}
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="user-id"
                className="text-sm font-medium text-gray-700"
              >
                User ID
              </label>
              <p className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                {user.id}
              </p>
              <p className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                {user.id}
              </p>
            </div>
            <div>
              <label
                htmlFor="provider"
                className="text-sm font-medium text-gray-700"
              >
                Provider
              </label>
              <div className="mt-1">
                <Badge variant="secondary">GitHub</Badge>
              </div>
            </div>
            <div>
              <label
                htmlFor="last-sign-in"
                className="text-sm font-medium text-gray-700"
              >
                Last Sign In
              </label>
              <p className="text-sm text-gray-900">
                {new Date(user.last_sign_in_at || "").toLocaleString()}
              </p>
            </div>
            <div>
              <label
                htmlFor="email-confirmed"
                className="text-sm font-medium text-gray-700"
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
  );
}
