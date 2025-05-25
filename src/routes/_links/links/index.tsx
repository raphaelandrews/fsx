import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  ErrorComponent,
  Link,
} from "@tanstack/react-router";
import { ExternalLinkIcon, Verified } from "lucide-react";

import {
  type Link as LinkType,
  type LinkGroup,
  linkGroupsQueryOptions,
} from "~/db/queries";
import { cn } from "~/lib/utils";
import { siteConfig } from "~/utils/config";
import Instagram from "~/assets/instagram-logo.svg";
import Gmail from "~/assets/gmail-logo.svg";
import Facebook from "~/assets/facebook-logo.svg";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { NotFound } from "~/components/not-found";
import { buttonVariants } from "~/components/ui/button";

export const Route = createFileRoute("/_links/links/")({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(linkGroupsQueryOptions());
  },
  head: () => ({
    meta: [
      {
        title: `Links | ${siteConfig.name}`,
        description: "Links da Federação Sergipana de Xadrez",
        ogUrl: `${siteConfig.url}/links`,
        image: `${siteConfig.url}/og/og-links.jpg`,
      },
    ],
  }),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <NotFound />,
  component: RouteComponent,
});

function RouteComponent() {
  const { data, error } = useQuery(linkGroupsQueryOptions());

  if (error) {
    return <ErrorComponent error={error} />;
  }

  const linkGroups = data ? data : [];

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
          <img src={Instagram} alt="Instagram" className="h-6 w-6" />
        </a>

        <a
          href="https://www.facebook.com/sergipexadrez"
          target="_blank"
          rel="noreferrer"
          className="p-2.5 rounded-lg hover:bg-muted transition"
        >
          <img src={Facebook} alt="Facebook" className="h-6 w-6" />
        </a>

        <a
          href="mailto:fsx.presidente@gmail.com"
          target="_blank"
          rel="noreferrer"
          className="p-2.5 rounded-lg hover:bg-muted transition"
        >
          <img src={Gmail} alt="Gmail" className="h-6 w-6" />
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
}

interface Props {
  href: string;
  label: string;
  icon: string;
}

const LinkItem = ({ href, label, icon }: Props) => {
  return (
    <Link
      to={href}
      target="_blank"
      className={cn(
        buttonVariants({ variant: "card" }),
        "flex items-center justify-between w-full h-[inherit] p-3 rounded-2xl shadow"
      )}
    >
      <div className="grid place-items-center w-10 h-10 rounded-[10px] bg-sea shadow-lg [&>div>svg]:text-background dark:[&>div>svg]:text-primary [&>svg]:w-5 [&>svg]:h-5">
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation> */}
        <div dangerouslySetInnerHTML={{ __html: icon }} />
      </div>
      <p>{label}</p>
      <div className="grid place-items-center w-10 h-10">
        <ExternalLinkIcon className="w-4 h-4 stroke-foreground" />
      </div>
    </Link>
  );
};
