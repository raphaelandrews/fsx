import { Fragment } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowUpRight01Icon,
  FoldersIcon,
  InstagramIcon,
  MailboxIcon,
} from "@hugeicons/core-free-icons"
import { createFileRoute } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"

import { buttonVariants } from "@fsx/ui/components/button"
import { Button } from "@fsx/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@fsx/ui/components/tooltip"
import { cn } from "@fsx/ui/lib/utils"

import { Announcement } from "@/components/announcement"
import { DottedSeparator } from "@/components/dotted-separator"
import { Footer } from "@/components/footer"
import { Logo } from "@/components/logo"
import { useTRPC } from "@/utils/trpc"

export const Route = createFileRoute("/links")({
  head: () => ({
    meta: [
      { title: "Links - FSX" },
      { name: "description", content: "Links úteis." },
    ],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.links.list.queryOptions()),
  component: RouteComponent,
})

function LinkItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "flex h-[inherit] w-full items-center justify-between rounded-none p-3",
      )}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground shadow-lg [&>div>svg]:h-4 [&>div>svg]:w-4">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static icon markup from the database */}
        <div dangerouslySetInnerHTML={{ __html: icon }} />
      </div>
      <span>{label}</span>
      <div className="grid h-8 w-8 place-items-center">
        <HugeiconsIcon icon={ArrowUpRight01Icon} className="size-4 stroke-foreground" />
      </div>
    </a>
  )
}

function RouteComponent() {
  const trpc = useTRPC()
  const { data: linkGroups = [] } = useSuspenseQuery(trpc.links.list.queryOptions())

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden">
      <div className="pointer-events-none absolute inset-x-2 inset-y-0 dotted-border-x sm:inset-x-8 md:inset-x-0 md:left-1/2 md:max-w-[720px] md:w-full md:-translate-x-1/2" />
      <main className="relative flex-1">
        <section>
          <div className="relative mx-2 p-3 sm:mx-8 md:mx-auto md:max-w-[720px] md:p-3">
            <div className="relative h-32 w-full overflow-hidden rounded-lg">
              <div className="absolute inset-0 z-0 bg-[radial-gradient(450px_circle_at_center,--color-(--primary)/20,transparent)] [mask-image:radial-gradient(450px_circle_at_center,white,transparent)]" />
              <div className="absolute inset-0 dotted-border-x opacity-40" />
            </div>

            <DottedSeparator fullWidth />

            <div className="flex items-center justify-between gap-4 p-4">
              <Logo className="h-5 text-foreground" />

              <div className="flex gap-2.5">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        className="size-8 border-dashed"
                        size="icon"
                        variant="outline"
                        render={
                          <a
                            href="https://www.instagram.com/xadrezsergipe/"
                            rel="noreferrer"
                            target="_blank"
                          />
                        }
                      />
                    }
                  >
                    <HugeiconsIcon icon={InstagramIcon} className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>Instagram</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        className="size-8 border-dashed"
                        size="icon"
                        variant="outline"
                        render={
                          <a
                            href="mailto:fsx.presidente@gmail.com"
                            rel="noreferrer"
                            target="_blank"
                          />
                        }
                      />
                    }
                  >
                    <HugeiconsIcon icon={MailboxIcon} className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>Email</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {linkGroups.map((item) => (
              <section className="mb-0" key={item.id}>
                <Announcement icon={FoldersIcon} label={item.label} className="text-sm" topSeparator />
                <div className="flex flex-col">
                  {item.links?.map((link, linkIndex) => (
                    <Fragment key={link.href}>
                      <div className="m-1">
                        <LinkItem href={link.href} icon={link.icon} label={link.label} />
                      </div>
                      {linkIndex < (item.links?.length ?? 0) - 1 && <DottedSeparator />}
                    </Fragment>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <DottedSeparator />
        </section>
      </main>
      <Footer />
    </div>
  )
}
