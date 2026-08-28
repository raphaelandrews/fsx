
import { useEffect, useState } from "react"
import { Link, useLocation } from "@tanstack/react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Cancel01Icon,
  ChevronDownIcon,
  Menu01Icon,
} from "@hugeicons/core-free-icons"

import { navigationData } from "./header-navigation-data"
import { Logo } from "../logo"
import { Button } from "@fsx/ui/components/button"
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

  const items = navigationData()

  return (
    <Drawer onOpenChange={setOpen} open={open}>
      <DrawerTrigger
        render={
          <Button
            aria-label="Abrir menu de navegação"
            className="shrink-0 p-2 hover:bg-muted/50 xl:hidden shadow-none"
            size="icon"
            variant="outline"
          />
        }
      >
        <HugeiconsIcon className="size-4" icon={Menu01Icon} />
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
            className="rounded-md border border-border p-2.5 text-foreground transition-colors hover:bg-muted"
          >
            <HugeiconsIcon className="size-5" icon={Cancel01Icon} />
          </DrawerClose>
        </div>

        <nav className="flex flex-1 flex-col overflow-y-auto px-6 pb-8">
          <ul>
            {items.map(({ label, href, items, target }) => {
              if (items?.length) {
                const isOpen = openSection === label
                return (
                  <li key={label} className="border-b border-border py-2">
                    <button
                      type="button"
                      onClick={() => setOpenSection(isOpen ? null : label)}
                      className="flex w-full items-center justify-between py-3 text-left text-lg font-semibold text-foreground"
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
                              className="flex items-center gap-3 px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
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
                    onClick={() => setOpen(false)}
                    className="block py-3 text-lg font-semibold text-foreground"
                  >
                    {label}
                  </Link>
                </li>
              )
            })}

            <li className="border-b border-border py-2">
              <a
                href="https://www.instagram.com/xadrezsergipe/"
                target="_blank"
                rel="noreferrer"
                onClick={() => setOpen(false)}
                className="block py-3 text-lg font-semibold text-foreground"
              >
                Instagram
              </a>
            </li>
            <li className="border-b border-border py-2">
              <a
                href="mailto:fsx.presidente@gmail.com"
                onClick={() => setOpen(false)}
                className="block py-3 text-lg font-semibold text-foreground"
              >
                Email
              </a>
            </li>
          </ul>
        </nav>
      </DrawerContent>
    </Drawer>
  )
}
