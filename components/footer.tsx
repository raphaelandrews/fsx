import { cn } from "@/lib/utils";

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        className,
        "container flex flex-col justify-between items-center gap-4 py-6 md:py-8 md:flex-row"
      )}
    >
      <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
        Built by 🏝️{" "}
        <a
          href="https://ndrws.neocities.org/"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-sea hover:text-gold transition duration-200"
        >
          Andrews
        </a>
        .
      </p>
    </footer>
  );
}
