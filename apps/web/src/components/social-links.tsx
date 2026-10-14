import { HugeiconsIcon } from "@hugeicons/react";
import { InstagramIcon, Mail02Icon } from "@hugeicons/core-free-icons";

import { buttonVariants } from "@fsx/ui/components/button";

const SOCIALS = [
  { label: "Instagram da FSX (@xadrezsergipe)", href: "https://www.instagram.com/xadrezsergipe/", icon: InstagramIcon },
  { label: "Enviar e-mail para a FSX", href: "mailto:presidente@fsx.org.br", icon: Mail02Icon },
];

export function SocialLinks({ className }: { className?: string }) {
  return (
    <div className={className}>
      {SOCIALS.map(({ label, href, icon }) => (
        <a
          key={href}
          aria-label={label}
          className={buttonVariants({ variant: "secondary", size: "icon-xl", className: "active:scale-[0.96]" })}
          href={href}
          rel="noreferrer"
          target={href.startsWith("mailto:") ? undefined : "_blank"}
        >
          <HugeiconsIcon className="size-5" icon={icon} strokeWidth={1.75} aria-hidden />
        </a>
      ))}
    </div>
  );
}
