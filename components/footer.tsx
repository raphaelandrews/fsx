import { cn } from "@/lib/utils";

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        className,
        "container flex flex-col items-center gap-4 md:flex-row"
      )}
    >
      <div className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
        Built by 🏝️{" "}
        <a
          href="https://ndrws.neocities.org/"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-sea hover:text-gold transition duration-200"
        >
          Andrews
        </a>
        . {" "}
        <a
          href="https://github.com/raphaelandrews/fsx"
          target="_blank"
          rel="noreferrer"
          className="font-medium hover:text-gold transition duration-200"
        >
          Source code
        </a>
        .
      </div>
    </footer>
  );
}
