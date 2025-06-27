/** biome-ignore-all lint/performance/noImgElement: No */
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLinkIcon, Verified } from "lucide-react";

import {
  getLinkGroups,
  type Link as LinkType,
  type LinkGroup,
} from "@/db/queries";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";

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
        url: `${siteConfig.url}/og/og-links.jpg`,
        width: 1920,
        height: 1080,
      },
    ],
  },
};

export const revalidate = 0;

const Links = async () => {
  const linkGroups = await getLinkGroups();

  return (
    <>
      <Avatar className="w-16 h-16 rounded-md">
        <AvatarImage
          src="https://9nkvm1j67x.ufs.sh/f/sYfAN6LQ1AETHxsUnVCtk7iXncQ2a89DJ0RhMfAIZzLqeYS3"
          alt="FSX Logo"
          title="FSX Logo"
          className="object-cover"
        />
        <AvatarFallback className="rounded-md">F</AvatarFallback>
      </Avatar>

      <section className="flex items-center justify-center gap-3 w-full">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl text-center text-primary font-semibold">
            FSX
          </h1>
          <Verified
            className="!fill-[#1CA0F2] dark:stroke-[1.5] stroke-background"
            aria-label="Verificado"
          />
        </div>
      </section>

      <div className="flex gap-2.5">
        <a
          href="https://www.instagram.com/xadrezsergipe/"
          target="_blank"
          rel="noreferrer"
          className="p-2.5 rounded-lg hover:bg-muted transition"
        >
          <img src="/instagram-logo.svg" alt="Instagram" className="h-6 w-6" />
        </a>

        <a
          href="https://www.facebook.com/sergipexadrez"
          target="_blank"
          rel="noreferrer"
          className="p-2.5 rounded-lg hover:bg-muted transition"
        >
          <img src="/facebook-logo.svg" alt="Instagram" className="h-6 w-6" />
        </a>

        <a
          href="mailto:fsx.presidente@gmail.com"
          target="_blank"
          rel="noreferrer"
          className="p-2.5 rounded-lg hover:bg-muted transition"
        >
          <img src="/gmail-logo.svg" alt="Instagram" className="h-6 w-6" />
        </a>
      </div>

      {linkGroups.map((item: LinkGroup) => (
        <div key={item.id} className="grid gap-3 w-full">
          <h3 className="sm:text-lg text-center font-medium">{item.label}</h3>
          <div className="grid gap-2 w-full">
            {item.links?.map((item: LinkType) => (
              <LinkItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
};

export default Links;

interface Props {
  href: string;
  label: string;
  icon: string;
}

const LinkItem = ({ href, label, icon }: Props) => {
  return (
    <Link
      href={href}
      target="_blank"
      prefetch={false}
      className={cn(
        buttonVariants({ variant: "card" }),
        "flex items-center justify-between w-full h-[inherit] p-3 rounded-2xl shadow"
      )}
    >
      <div className="grid place-items-center w-10 h-10 rounded-[10px] bg-sea shadow-lg [&>div>svg]:text-background dark:[&>div>svg]:text-primary [&>svg]:w-5 [&>svg]:h-5">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: No */}
        <div dangerouslySetInnerHTML={{ __html: icon }} />
      </div>
      <p>{label}</p>
      <div className="grid place-items-center w-10 h-10">
        <ExternalLinkIcon className="w-4 h-4 stroke-foreground" />
      </div>
    </Link>
  );
};
