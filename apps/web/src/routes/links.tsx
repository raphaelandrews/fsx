import { Fragment } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowUpRight01Icon,
  FoldersIcon,
  InstagramIcon,
  Mail01Icon,
} from "@hugeicons/core-free-icons";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Button } from "@fsx/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@fsx/ui/components/tooltip";

import { Announcement } from "@/components/announcement";
import { FlickeringGrid } from "@/components/flickering-grid";
import { Footer } from "@/components/footer";
import { Logo } from "@/components/logo";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/links")({
  head: () => ({
    meta: [{ title: "Links - FSX" }, { name: "description", content: "Links úteis." }],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.links.list.queryOptions()),
  component: RouteComponent,
});

function LinkItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <a
      className="flex h-[inherit] w-full items-center justify-between rounded-lg bg-card p-3 transition-colors hover:bg-muted"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <div
        aria-hidden="true"
        className="grid h-8 w-8 place-items-center rounded-md bg-forest text-forest-foreground shadow-lg [&>div>svg]:h-4 [&>div>svg]:w-4"
      >
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static icon markup from the database */}
        <div dangerouslySetInnerHTML={{ __html: icon }} />
      </div>
      <span>{label}</span>
      <div className="grid h-8 w-8 place-items-center">
        <HugeiconsIcon
          aria-hidden="true"
          className="size-4 stroke-foreground"
          icon={ArrowUpRight01Icon}
        />
      </div>
    </a>
  );
}

function RouteComponent() {
  const trpc = useTRPC();
  const { data: linkGroups = [] } = useSuspenseQuery(trpc.links.list.queryOptions());

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden">
      <main className="relative flex-1">
        <section>
          <h1 className="sr-only">Links</h1>
          <div className="relative mx-2 p-3 sm:mx-8 md:mx-auto md:max-w-[720px] md:p-3">
            <div className="relative h-32 w-full overflow-hidden rounded-lg">
              <FlickeringGrid
                className="absolute inset-0 z-0 size-full [mask-image:radial-gradient(450px_circle_at_50%_50%,white,transparent)]"
                color="#7ec051"
                flickerChance={0.1}
                gridGap={6}
                maxOpacity={0.5}
                squareSize={4}
              />
            </div>

            <div className="flex items-center justify-between gap-4 p-4">
              <Logo className="h-5 text-foreground" />

              <div className="flex gap-2.5">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        className="size-8"
                        size="icon"
                        variant="outline"
                        render={
                          <a
                            aria-label="Instagram"
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
                        className="size-8"
                        size="icon"
                        variant="outline"
                        render={
                          <a
                            aria-label="Email"
                            href="mailto:fsx.presidente@gmail.com"
                            rel="noreferrer"
                            target="_blank"
                          />
                        }
                      />
                    }
                  >
                    <HugeiconsIcon icon={Mail01Icon} className="size-4" />
                  </TooltipTrigger>
                  <TooltipContent>Email</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {linkGroups.map((item) => (
              <section className="mb-0" key={item.id}>
                <Announcement icon={FoldersIcon} label={item.label} className="text-sm" />
                <div className="flex flex-col">
                  {item.links?.map((link) => (
                    <Fragment key={link.href}>
                      <div className="m-1">
                        <LinkItem href={link.href} icon={link.icon} label={link.label} />
                      </div>
                    </Fragment>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
