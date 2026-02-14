/** biome-ignore-all lint/performance/noImgElement: No */
import React, { Fragment } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { ExternalLinkIcon, FoldersIcon, InstagramIcon, Link2Icon, MailboxIcon } from "lucide-react"

import {
	getLinkGroups,
	type Link as LinkType,
	type LinkGroup,
} from "@/db/queries"
import { siteConfig } from "@/lib/site"
import { cn } from "@/lib/utils"

import { Button, buttonVariants } from "@/components/ui/button"
import { Announcement } from "@/components/announcement"
import { DottedSeparator } from "@/components/dotted-separator"
import { DottedX } from "@/components/dotted-x"
import { FlickeringGrid } from "@/components/ui/flickering-grid"

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"

export const metadata: Metadata = {
	title: "Links",
	description: "Links úteis.",
	openGraph: {
		url: `${siteConfig.url}/links`,
		title: "Links",
		description: "Links úteis.",
		siteName: "Links",
	},
}

const Links = async () => {
	const linkGroups = await getLinkGroups()

	return (
		<section>
			<DottedX className="p-0">
				<div className="p-3">
					<div className="relative h-32 w-full overflow-hidden rounded-lg">
						<FlickeringGrid
							className="absolute inset-0 size-full z-0 [mask-image:radial-gradient(450px_circle_at_center,white,transparent)]"
							squareSize={4}
							gridGap={6}
							color="#60A5FA"
							maxOpacity={0.5}
							flickerChance={0.1}
						/>
					</div>
				</div>

				<DottedSeparator fullWidth />
				{/* Header Section */}
				<div className="p-4 flex justify-between items-center gap-4">
					<img src="/logo.svg" alt="Logo" className="h-5" title="Logo" />

					<div className="flex gap-2.5">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="square"
									variant="dashed"
									asChild
								>
									<a
										href="https://www.instagram.com/xadrezsergipe/"
										rel="noreferrer"
										target="_blank"
									>
										<InstagramIcon size={16} />
									</a>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Instagram</p>
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									size="square"
									variant="dashed"
									asChild
								>
									<a
										href="mailto:fsx.presidente@gmail.com"
										rel="noreferrer"
										target="_blank"
									>
										<MailboxIcon size={16} />
									</a>
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Email</p>
							</TooltipContent>
						</Tooltip>
					</div>
				</div>

				{/* Link Groups */}
				{linkGroups.map((item: LinkGroup) => (
					<section className="mb-0" key={item.id}>
						<Announcement icon={FoldersIcon} label={item.label} className="text-sm" topSeparator />
						<div className="flex flex-col">
							{item.links?.map((link: LinkType, linkIndex: number) => (
								<Fragment key={link.href}>
									<div className="m-1">
										<LinkItem
											href={link.href}
											icon={link.icon}
											label={link.label}
										/>
									</div>
									{linkIndex < (item.links?.length ?? 0) - 1 && <DottedSeparator />}
								</Fragment>
							))}
						</div>
					</section>
				))}
			</DottedX>
			<DottedSeparator />
		</section>
	)
}

export default Links

interface Props {
	href: string
	label: string
	icon: string
}

const LinkItem = ({ href, label, icon }: Props) => {
	return (
		<Link
			className={cn(
				buttonVariants({ variant: "ghost" }),
				"flex h-[inherit] w-full items-center justify-between rounded-none p-3",
			)}
			href={href}
			prefetch={false}
			target="_blank"
		>
			<div className="grid h-8 w-8 place-items-center rounded-md bg-link shadow-lg [&>div>svg]:text-background dark:[&>div>svg]:text-primary [&>div>svg]:h-4 [&>div>svg]:w-4">
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: No */}
				<div dangerouslySetInnerHTML={{ __html: icon }} />
			</div>
			<span>{label}</span>
			<div className="grid h-8 w-8 place-items-center">
				<ExternalLinkIcon className="h-4 w-4 stroke-foreground" />
			</div>
		</Link>
	)
}
