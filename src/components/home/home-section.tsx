import type { LucideIcon } from "lucide-react";
import { Announcement } from "../announcement";
import { cn } from "~/lib/utils";

interface HomeSectionProps {
  label?: string;
  className?: string;
  href?: string;
  icon: LucideIcon;
  main: boolean;
  children: React.ReactNode;
}

export function HomeSection({
  label,
  className,
  href,
  icon,
  main,
  children,
}: HomeSectionProps) {
  return (
    <section className={cn(className, "my-10")}>
      {!main && <Announcement label={label} href={href} icon={icon} />}

      <div className="mt-3">{children}</div>
    </section>
  );
}
