import { cn } from "@fsx/ui/lib/utils";

import { avatarGradientFor } from "@/components/avatar-gradient";

export function ClubLogo({ name, logoUrl, className }: { name: string; logoUrl: string | null; className?: string }) {
  return logoUrl ? (
    <img
      alt=""
      decoding="async"
      loading="lazy"
      height={20}
      width={20}
      className={cn("size-5 shrink-0 rounded object-contain", className)}
      src={logoUrl}
    />
  ) : (
    <span className={cn("size-5 shrink-0 rounded", avatarGradientFor(name), className)} aria-hidden />
  );
}
