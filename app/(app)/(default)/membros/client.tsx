"use client"

import { useMemo } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import type { PlayerRole } from "@/db/queries"
import { cn } from "@/lib/utils"

function MemberCard({
	name,
	role,
	id,
	imageUrl,
}: {
	name: string
	role: string
	id: number
	imageUrl?: string | null
}) {
	return (
		<div className="relative aspect-[3/4] w-full overflow-hidden rounded-[20px] bg-black p-6 text-white shadow-2xl transition-transform duration-300 hover:scale-[1.02]">
			{/* Subtle Texture/Noise */}
			<div className="pointer-events-none absolute inset-0 opacity-20"
				style={{
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
				}}
			/>

			{/* Border Gradient */}
			<div className="absolute inset-0 rounded-[20px] border border-white/10" />

			<div className="relative flex h-full flex-col justify-between">
				{/* Top Logo/Brand */}
				<div className="flex items-center justify-center opacity-50">
					{/* Replace with FSX Logo or Icon if available, mimicking the 'hero' logo */}
					<span className="text-sm font-medium tracking-wide">FSX</span>
				</div>

				{/* Center Content */}
				<div className="flex flex-col items-center justify-center text-center">
					{imageUrl && (
						<div className="mb-4 size-20 overflow-hidden rounded-full border-2 border-white/10 shadow-lg">
							<img src={imageUrl} alt={name} className="size-full object-cover" />
						</div>
					)}
					<h3 className="font-bold text-2xl tracking-tight text-white mb-1">{name}</h3>
					<p className="text-sm font-medium text-white/50 uppercase tracking-widest">{role}</p>
				</div>

				{/* Footer Info */}
				<div className="flex items-end justify-between text-xs text-white/40">
					<div className="flex flex-col gap-0.5">
						<span className="uppercase tracking-wider">Entrou em</span>
					</div>
					<div className="flex flex-col items-end gap-0.5">
						<span className="uppercase tracking-wider">Membro</span>
						<span className="font-mono text-white/70"># {id.toString().padStart(4, "0")}</span>
					</div>
				</div>
			</div>
		</div>
	)
}

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
		<div className="space-y-12 pb-12">
			<section>
				<h2 className="mb-6 font-semibold text-2xl tracking-tight">Diretoria</h2>
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{management.map((item) => {
						if (!item.playersToRoles?.length) return null
						return item.playersToRoles.map((member) => (
							<MemberCard
								key={`${item.role}-${member.player.id}`}
								name={member.player.name}
								role={item.role}
								id={member.player.id}
								imageUrl={member.player.imageUrl}
							/>
						))
					})}
				</div>
			</section>

			<section>
				<h2 className="mb-6 font-semibold text-2xl tracking-tight">Árbitros</h2>
				<div className="flex flex-col gap-8">
					{referee.map((item) => {
						if (!item.playersToRoles?.length) return null
						return (
							<div key={item.role}>
								<h3 className="mb-4 font-medium text-lg text-muted-foreground">
									{item.role}
								</h3>
								<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
									{item.playersToRoles.map((member) => (
										<MemberCard
											key={`${item.role}-${member.player.id}`}
											name={member.player.name}
											role={item.role}
											id={member.player.id}
											imageUrl={member.player.imageUrl}
										/>
									))}
								</div>
							</div>
						)
					})}
				</div>
			</section>
		</div>
	)
}
