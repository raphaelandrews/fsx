
import { useEffect, useState } from "react"
import { Link, useLocation } from "@tanstack/react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowUpRight01Icon,
  Cancel01Icon,
  ChevronDownIcon,
  Menu01Icon,
} from "@hugeicons/core-free-icons"

import { NAVIGATION } from "./header-navigation-data"
import { Logo } from "../logo"
import { SocialLinks } from "../social-links"
import { Button, buttonVariants } from "@fsx/ui/components/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@fsx/ui/components/drawer"
import { cn } from "@fsx/ui/lib/utils"

export const HeaderNavigationDrawer = () => {
  const [open, setOpen] = useState(false)
  const [openSection, setOpenSection] = useState<string | null>(null)
  const pathname = useLocation().pathname

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Drawer onOpenChange={setOpen} open={open}>
      <DrawerTrigger
        render={
          <Button
            aria-label="Abrir menu de navegação"
            className="shrink-0 p-2 hover:bg-muted/50 xl:hidden shadow-none"
            size="icon-xl"
            variant="outline"
          />
        }
      >
        <HugeiconsIcon className="size-5" icon={Menu01Icon} />
      </DrawerTrigger>

      <DrawerContent className="!inset-0 !h-dvh !max-h-dvh !w-full !rounded-none !border-0 !bg-background">
        <div className="flex shrink-0 items-center justify-between px-6 py-5">
          <Link
            to="/"
            aria-label="Federação Sergipana de Xadrez"
            onClick={() => setOpen(false)}
          >
            <Logo className="h-7 w-auto text-foreground" />
          </Link>
          <DrawerClose
            aria-label="Fechar menu"
            className={buttonVariants({ variant: "outline", size: "icon-xl", className: "shadow-none" })}
          >
            <HugeiconsIcon className="size-5" icon={Cancel01Icon} />
          </DrawerClose>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-6 pb-8">
          <ul>
            {NAVIGATION.map(({ label, href, items, target }) => {
              if (items?.length) {
                const isOpen = openSection === label
                return (
                  <li key={label} className="border-b border-border py-2">
                    <button
                      type="button"
                      onClick={() => setOpenSection(isOpen ? null : label)}
                      className="flex w-full items-center justify-between py-3 text-left text-base font-semibold text-foreground"
                    >
                      {label}
                      <HugeiconsIcon
                        icon={ChevronDownIcon}
                        className={cn(
                          "size-5 shrink-0 transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    </button>
                    {isOpen && (
                      <ul className="space-y-1 pb-3">
                        {items.map((sub) => (
                          <li key={sub.href}>
                            <Link
                              to={sub.href}
                              target={sub.target}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-semibold text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-primary/10 aria-[current=page]:text-primary aria-[current=page]:transition-none"
                            >
                              <HugeiconsIcon
                                className="size-5 shrink-0"
                                icon={sub.icon}
                              />
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              }

              return (
                <li key={label} className="border-b border-border py-2">
                  <Link
                    to={href}
                    target={target}
                    activeOptions={{ exact: href === "/" }}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between py-3 text-base font-semibold text-foreground aria-[current=page]:text-primary"
                  >
                    {label}
                    {target === "_blank" && (
                      <>
                        <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-5 text-muted-foreground" aria-hidden />
                        <span className="sr-only"> (abre em nova aba)</span>
                      </>
                    )}
                  </Link>
                </li>
              )
            })}

          </ul>

          <SocialLinks className="mt-8 flex items-center gap-3" />
        </nav>
      </DrawerContent>
    </Drawer>
  )
}
