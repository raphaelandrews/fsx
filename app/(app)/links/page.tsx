/** biome-ignore-all lint/performance/noImgElement: No */
import type { Metadata } from "next"
import Link from "next/link"
import { ExternalLinkIcon, Verified, Link2Icon, ShareIcon } from "lucide-react"

import {
	getLinkGroups,
	type Link as LinkType,
	type LinkGroup,
} from "@/db/queries"
import { siteConfig } from "@/lib/site"
import { cn } from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { Announcement } from "@/components/announcement"
import { DottedSeparator } from "@/components/dotted-separator"

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
		<PageHeader icon={Link2Icon} label="Links">
			{/* Profile Section */}
			<section className="mb-0">
				<div className="p-4 flex flex-col items-center gap-4">
					<Avatar className="h-16 w-16 rounded-md">
						<AvatarImage
							alt="FSX Logo"
							className="object-cover"
							src="https://9nkvm1j67x.ufs.sh/f/sYfAN6LQ1AETHxsUnVCtk7iXncQ2a89DJ0RhMfAIZzLqeYS3"
							title="FSX Logo"
						/>
						<AvatarFallback className="rounded-md">F</AvatarFallback>
					</Avatar>

					<div className="flex items-center justify-center gap-2">
						<h1 className="text-center font-semibold text-2xl text-primary">
							FSX
						</h1>
						<Verified
							aria-label="Verificado"
							className="!fill-[#1CA0F2] stroke-background dark:stroke-[1.5]"
						/>
					</div>

					<div className="flex gap-2.5">
						<a
							className="rounded-lg p-2.5 transition hover:bg-muted border border-dashed"
							href="https://www.instagram.com/xadrezsergipe/"
							rel="noreferrer"
							target="_blank"
						>
							<img alt="Instagram" className="h-6 w-6" src="/instagram-logo.svg" />
						</a>
						<a
							className="rounded-lg p-2.5 transition hover:bg-muted border border-dashed"
							href="mailto:fsx.presidente@gmail.com"
							rel="noreferrer"
							target="_blank"
						>
							<img alt="email" className="h-6 w-6" src="/gmail-logo.svg" />
						</a>
					</div>
				</div>
				<DottedSeparator />
			</section>

			{/* Link Groups */}
			{linkGroups.map((item: LinkGroup, index: number) => (
				<section className="mb-0" key={item.id}>
					<Announcement icon={ShareIcon} label={item.label} className="text-sm" />
					<div className="p-4 grid gap-2">
						{item.links?.map((link: LinkType) => (
							<LinkItem
								href={link.href}
								icon={link.icon}
								key={link.href}
								label={link.label}
							/>
						))}
					</div>
					{index < linkGroups.length - 1 && <DottedSeparator />}
				</section>
			))}
		</PageHeader>
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
				"flex h-[inherit] w-full items-center justify-between rounded-none p-0",
			)}
			href={href}
			prefetch={false}
			target="_blank"
		>
			<div className="grid h-10 w-10 place-items-center rounded-[10px] bg-link shadow-lg [&>div>svg]:text-background dark:[&>div>svg]:text-primary [&>svg]:h-5 [&>svg]:w-5">
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: No */}
				<div dangerouslySetInnerHTML={{ __html: icon }} />
			</div>
			<p>{label}</p>
			<div className="grid h-10 w-10 place-items-center">
				<ExternalLinkIcon className="h-4 w-4 stroke-foreground" />
			</div>
		</Link>
	)
}
