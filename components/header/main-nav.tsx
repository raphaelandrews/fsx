/** biome-ignore-all lint/nursery/noShadow: No */
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

import { navigationData } from "./header-navigation-data"
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

export function MainNav() {
	const pathname = usePathname()
	const items = navigationData()

	const getIsActive = (href: string) => pathname === href

	return (
		<div className="mr-4 flex">
			<Link className="mr-4 flex items-center space-x-2 lg:mr-6" href="/">
				<span className="mt-0.5 font-bold">FSX</span>
			</Link>
			<NavigationMenu className="ml-1 hidden lg:block">
				<NavigationMenuList className="gap-4 space-x-[inherit] text-sm lg:gap-6">
					{items.map(({ label, items, href, target }) => {
						const hasItems = Boolean(items?.length)

						if (hasItems) {
							return (
								<NavigationMenuItem key={label}>
									<NavigationMenuTrigger
										className={cn(
											"bg-transparent p-0 text-foreground/60 transition-colors hover:cursor-pointer hover:bg-transparent hover:text-foreground/80 focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent",
											getIsActive(href) && "text-foreground"
										)}
									>
										{label}
									</NavigationMenuTrigger>

									<NavigationMenuContent className="flex gap-4 p-4 md:w-[500px] lg:w-[700px]">
										{href === "#" && <NavigationMenuImage href={href} />}
										{href === "##" && <NavigationMenuImage href={href} />}

										<ul
											className="flex w-full flex-wrap gap-3"
											style={{ maxHeight: "400px" }}
										>
											{items?.map(
												({ href, icon: Icon, label, description }) => (
													<li className="flex-[1_1_45%]" key={label}>
														<NavigationMenuLink asChild>
															<Link
																className={cn(
																	"block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
																	getIsActive(href) && "bg-muted"
																)}
																href={href}
															>
																<div className="flex items-center gap-2">
																	<Icon height={12} width={12} />
																	<div className="font-medium text-sm leading-none">
																		{label}
																	</div>
																</div>

																<p className="line-clamp-2 text-muted-foreground text-sm leading-snug">
																	{description}
																</p>
															</Link>
														</NavigationMenuLink>
													</li>
												)
											)}
										</ul>
									</NavigationMenuContent>
								</NavigationMenuItem>
							)
						}

						return (
							<NavigationMenuItem
								asChild
								className={cn(
									navigationMenuTriggerStyle(),
									"bg-transparent p-0 text-foreground/60 transition-colors hover:bg-transparent hover:text-foreground/80 focus:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent",
									getIsActive(href) && "text-foreground"
								)}
								key={label}
							>
								<Link
									className="flex items-center gap-2"
									href={href}
									target={target}
								>
									{label}
								</Link>
							</NavigationMenuItem>
						)
					})}
				</NavigationMenuList>
			</NavigationMenu>
		</div>
	)
}

const NavigationMenuImage = ({ href }: { href: string }) => {
	return (
		<>
			{href === "#" && (
				<div className="relative h-[185px] w-[128px] min-w-[128px] overflow-hidden rounded-md border bg-gradient-to-br from-cyan-500 to-blue-500 shadow" />
			)}
			{href === "##" && (
				<div className="relative h-[185px] w-[128px] min-w-[128px] overflow-hidden rounded-md border bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow" />
			)}
		</>
	)
}
