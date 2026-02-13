"use client"

import { Briefcase, Flag } from "lucide-react"
import { useMemo } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DottedSeparator } from "@/components/dotted-separator"

import type { PlayerRole } from "@/db/queries"
import { Announcement } from "@/components/announcement"

export function Client({ roles }: { roles: PlayerRole[] }) {
	const management = useMemo(() => {
		return roles
			.filter((role) => role.type === "management")
			.flatMap((item) =>
				(item.playersToRoles ?? []).map((member) => ({
					...member,
					roleName: item.role,
				}))
			)
	}, [roles])

	const referee = useMemo(() => {
		return roles
			.filter(
				(role) =>
					role.type === "referee" && (role.playersToRoles?.length ?? 0) > 0
			)
	}, [roles])

	return (
		<>
			<section className="mb-0">
				<Announcement icon={Briefcase} label="Diretoria" className="text-sm" />

				<div className="flex flex-col">
					{management.map((member, index) => (
						<MemberCard
							key={`${member.roleName}-${member.player.id}`}
							name={member.player.name}
							role={member.roleName}
							imageUrl={member.player.imageUrl}
							isLast={index === management.length - 1}
						/>
					))}
				</div>

				<DottedSeparator />
			</section>

			<section className="mb-0">
				<Announcement icon={Flag} label="Árbitros" className="text-sm" />

				<div className="flex flex-col">
					{referee.map((item, index) => {
						if (!item.playersToRoles?.length) return null
						return (
							<div key={item.role}>
								<Announcement label={item.role} className="text-xs" />
								<div className="flex flex-col">
									{item.playersToRoles.map((member, index) => (
										<MemberCard
											key={`${item.role}-${member.player.id}`}
											name={member.player.name}
											role={item.role}
											imageUrl={member.player.imageUrl}
											isLast={index === item.playersToRoles.length - 1}
										/>
									))}
								</div>
								{index !== referee.length - 1 && <DottedSeparator className="w-full" />}
							</div>
						)
					})}
				</div>
			</section>
		</>
	)
}

function MemberCard({
	name,
	role,
	imageUrl,
	isLast,
}: {
	name: string
	role: string
	imageUrl?: string | null
	isLast: boolean
}) {
	return (
		<div>
			<div className="m-1">
				<div className="flex items-center justify-between group hover:bg-muted/50 transition-colors duration-300 p-3 select-none">
					<div className="flex items-center gap-4">
						<Avatar className="size-10">
							{imageUrl && <AvatarImage src={imageUrl} alt={name} />}
							<AvatarFallback>
								<span className="font-bold text-xs text-muted-foreground uppercase">
									{name.slice(0, 2)}
								</span>
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col gap-1">
							<h3 className="text-sm font-bold leading-tight">{name}</h3>
							<p className="text-xs font-medium text-muted-foreground">{role}</p>
						</div>
					</div>
				</div>
			</div>
			{!isLast && <DottedSeparator className="w-full" />}
		</div>
	)
}