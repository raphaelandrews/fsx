"use client"

import { useMemo } from "react"

import type { PlayerRole } from "@/db/queries"
import { getGradient } from "@/lib/generate-gradients"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Client({ roles }: { roles: PlayerRole[] }) {
	const management = useMemo(() => {
		return roles.filter((role) => role.type === "management")
	}, [roles])

	const referee = useMemo(() => {
		return roles
			.filter(
				(role) =>
					role.type === "referee" && (role.playersToRoles?.length ?? 0) > 0
			)
			.reverse()
	}, [roles])

	return (
		<div className="space-y-8">
			<section>
				<h2 className="font-semibold leading-none tracking-tight">Diretoria</h2>
				<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{management.map((item, index) => {
						if (!item.playersToRoles?.length) return null
						const gradient = getGradient(index)
						return (
							<Card
								className="rounded-lg bg-card transition-all hover:cursor-pointer hover:bg-accent"
								key={item.role}
							>
								<CardContent className="flex items-center space-x-3 p-3 text-sm">
									{item.playersToRoles?.map((member) => (
										<Avatar key={`${item.role}-${member.player.id}`}>
											<AvatarImage
												alt={member.player.name}
												src={member.player.imageUrl || undefined}
												title={member.player.name}
											/>
											<AvatarFallback style={gradient} />
										</Avatar>
									))}
									<div className="mt-1">
										{item.playersToRoles?.map((member) => (
											<p
												className="webkit-line-clamp-1 line-clamp-1 font-medium leading-none"
												key={`${item.role}-${member.player.id}-name`}
											>
												{member.player.name}
											</p>
										))}
										<p className="webkit-line-clamp-1 line-clamp-1 text-muted-foreground">
											{item.role}
										</p>
									</div>
								</CardContent>
							</Card>
						)
					})}
				</div>
			</section>
			<section>
				<h2 className="font-semibold leading-none tracking-tight">Árbitros</h2>
				<div className="mt-1 flex flex-col gap-3">
					{referee.map((item) => {
						if (!item.playersToRoles?.length) return null
						return (
							<div className="mt-3" key={item.role}>
								<h3 className="font-medium text-sm leading-none tracking-tight">
									{item.role}
								</h3>
								<div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
									{item.playersToRoles?.map((member) => {
										const gradient = getGradient(member.player.id)
										return (
											<Card
												className="rounded-lg bg-card transition-all hover:cursor-pointer hover:bg-accent"
												key={`${item.role}-${member.player.id}`}
											>
												<CardContent className="flex items-center space-x-3 p-3 text-sm">
													<Avatar>
														<AvatarImage
															alt={member.player.name}
															src={member.player.imageUrl || undefined}
															title={member.player.name}
														/>
														<AvatarFallback style={gradient} />
													</Avatar>
													<div className="mt-1">
														<p className="webkit-line-clamp-1 line-clamp-1 font-medium leading-none">
															{member.player.name}
														</p>
														<p className="webkit-line-clamp-1 line-clamp-1 text-muted-foreground">
															{item.role}
														</p>
													</div>
												</CardContent>
											</Card>
										)
									})}
								</div>
							</div>
						)
					})}
				</div>
			</section>
		</div>
	)
}
