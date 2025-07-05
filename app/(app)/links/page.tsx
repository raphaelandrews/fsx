/** biome-ignore-all lint/performance/noImgElement: No */
import type { Metadata } from "next"
import Link from "next/link"
import { ExternalLinkIcon, Verified } from "lucide-react"

import {
	getLinkGroups,
	type Link as LinkType,
	type LinkGroup,
} from "@/db/queries"
import { siteConfig } from "@/lib/site"
import { cn } from "@/lib/utils"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Links",
  description: "Links da FSX",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: `${siteConfig.url}/links`,
    title: "FSX | Links",
    description: "Links da Federação Sergipana de Xadrez",
    siteName: "FSX | Links",
    images: [
      {
        url: `/og?title=${encodeURIComponent("Links")}`,
      },
    ],
  },
};

export const revalidate = 0

const Links = async () => {
	const linkGroups = await getLinkGroups()

	return (
		<>
			<Avatar className="h-16 w-16 rounded-md">
				<AvatarImage
					alt="FSX Logo"
					className="object-cover"
					src="https://9nkvm1j67x.ufs.sh/f/sYfAN6LQ1AETHxsUnVCtk7iXncQ2a89DJ0RhMfAIZzLqeYS3"
					title="FSX Logo"
				/>
				<AvatarFallback className="rounded-md">F</AvatarFallback>
			</Avatar>

			<section className="flex w-full items-center justify-center gap-3">
				<div className="flex items-center justify-center gap-2">
					<h1 className="text-center font-semibold text-2xl text-primary">
						FSX
					</h1>
					<Verified
						aria-label="Verificado"
						className="!fill-[#1CA0F2] stroke-background dark:stroke-[1.5]"
					/>
				</div>
			</section>

			<div className="flex gap-2.5">
				<a
					className="rounded-lg p-2.5 transition hover:bg-muted"
					href="https://www.instagram.com/xadrezsergipe/"
					rel="noreferrer"
					target="_blank"
				>
					<img alt="Instagram" className="h-6 w-6" src="/instagram-logo.svg" />
				</a>
				<a
					className="rounded-lg p-2.5 transition hover:bg-muted"
					href="mailto:fsx.presidente@gmail.com"
					rel="noreferrer"
					target="_blank"
				>
					<img alt="email" className="h-6 w-6" src="/gmail-logo.svg" />
				</a>
			</div>

			{linkGroups.map((item: LinkGroup) => (
				<div className="grid w-full gap-3" key={item.id}>
					<h3 className="text-center font-medium sm:text-lg">{item.label}</h3>
					<div className="grid w-full gap-2">
						{item.links?.map((item: LinkType) => (
							<LinkItem
								href={item.href}
								icon={item.icon}
								key={item.href}
								label={item.label}
							/>
						))}
					</div>
				</div>
			))}
		</>
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
				buttonVariants({ variant: "card" }),
				"flex h-[inherit] w-full items-center justify-between rounded-2xl p-3 shadow"
			)}
			href={href}
			prefetch={false}
			target="_blank"
		>
			<div className="grid h-10 w-10 place-items-center rounded-[10px] bg-sea shadow-lg [&>div>svg]:text-background dark:[&>div>svg]:text-primary [&>svg]:h-5 [&>svg]:w-5">
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
