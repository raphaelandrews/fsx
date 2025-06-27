import { useMemo } from "react"

import { getGradient } from "@/lib/generate-gradients"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Props {
	id: number
	name: string | undefined
	imageUrl?: string | null
}

export const ActionsClub = ({ id, name, imageUrl }: Props) => {
	const gradient = useMemo(() => getGradient(id), [id])

	return (
		<div className="flex items-center gap-3">
			<Avatar className="h-5 w-5 rounded">
				<AvatarImage
					alt={name}
					className="object-contain"
					src={imageUrl || undefined}
				/>
				<AvatarFallback style={gradient} />
			</Avatar>
			<div className="whitespace-nowrap font-medium">{name}</div>
		</div>
	)
}
