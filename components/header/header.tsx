import { Suspense } from "react"
import { InstagramIcon, MailboxIcon, MenuIcon } from "lucide-react"

import { MainNav } from "./main-nav"
import { HeaderNavigationDrawer } from "./header-navigation-drawer"
import { CommandMenu } from "@/components/command-menu"
import { UpdateRegister } from "@/components/update-register"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DottedSeparator } from "@/components/dotted-separator"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"

export function Header() {
	return (
		<header className="sticky top-0 z-50 w-full border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="!max-w-[1280px] container flex h-14 items-center">
				<Suspense fallback={<MainNavSkeleton />}>
					<MainNav />
				</Suspense>
				<div className="ml-auto flex items-center gap-2 md:flex-1 md:justify-end">
					<div className="flex w-full flex-1 md:w-auto md:flex-none">
						<CommandMenu />
					</div>
					<Separator className="!w-0.5 !h-4 ml-2 mr-1" orientation="vertical" />

					<UpdateRegister />

					<Tooltip>
						<TooltipTrigger asChild className="!hidden sm:!flex">
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
						<TooltipTrigger asChild className="!hidden sm:!flex">
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

					<AnimatedThemeToggler />

					<Suspense fallback={<DrawerSkeleton />}>
						<HeaderNavigationDrawer />
					</Suspense>
				</div>
			</div>
			<DottedSeparator />
		</header>
	)
}

function MainNavSkeleton() {
	return (
		<div className="mr-4 flex">
			<div className="mr-4 flex items-center space-x-2 lg:mr-6">
				<span className="mt-0.5 font-bold">FSX</span>
			</div>
		</div>
	)
}

function DrawerSkeleton() {
	return (
		<Button
			className="shrink-0 p-2 hover:bg-muted/50 lg:hidden"
			size="sm"
			variant="ghost"
			disabled
		>
			<MenuIcon className="size-4" />
		</Button>
	)
}
