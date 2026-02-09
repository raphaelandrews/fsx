import { ImageResponse } from "next/og"

export const OG_SIZE = {
	width: 1200,
	height: 630,
}

export const OG_CONTENT_TYPE = "image/png"

export const OG_COLORS = {
	background: "#032EF3",
	text: "#FDF0D7",
}

interface DefaultOGProps {
	title: string
	description: string
}

export function generateDefaultOG({ title, description }: DefaultOGProps) {
	return new ImageResponse(
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				backgroundColor: OG_COLORS.background,
				padding: 60,
			}}
		>
			<div
				style={{
					display: "flex",
					fontSize: 64,
					fontWeight: 700,
					color: OG_COLORS.text,
					lineHeight: 1.2,
					maxWidth: "80%",
				}}
			>
				{title}
			</div>

			<div
				style={{
					display: "flex",
					fontSize: 32,
					color: OG_COLORS.text,
					opacity: 0.9,
					lineHeight: 1.4,
					maxWidth: "70%",
				}}
			>
				{description.length > 150
					? `${description.substring(0, 150)}...`
					: description}
			</div>
		</div>,
		{
			...OG_SIZE,
		}
	)
}

interface PlayerOGProps {
	name: string
	id: string
}

export function generatePlayerOG({ name, id }: PlayerOGProps) {
	return new ImageResponse(
		<div
			style={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
				justifyContent: "space-between",
				backgroundColor: OG_COLORS.background,
				padding: 60,
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "flex-end",
					fontSize: 48,
					fontWeight: 600,
					color: OG_COLORS.text,
					opacity: 0.7,
				}}
			>
				#{id}
			</div>

			<div
				style={{
					display: "flex",
					fontSize: 72,
					fontWeight: 700,
					color: OG_COLORS.text,
					lineHeight: 1.2,
				}}
			>
				{name}
			</div>
		</div>,
		{
			...OG_SIZE,
		}
	)
}
