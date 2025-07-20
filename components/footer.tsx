import { cn } from "@/lib/utils"

export function Footer({ className }: { className?: string }) {
	return (
    <footer
      className={cn(
        className,
        "container flex flex-col items-center gap-4 md:flex-row"
      )}
    >
      <div className="text-balance text-center text-muted-foreground text-sm leading-loose md:text-left">
        Built by 🏝️{" "}
        <a
          className="font-medium text-bulbasaur-foreground transition duration-200 hover:text-amber-500"
          href="https://ndrws.com/"
          rel="noreferrer"
          target="_blank"
        >
          Andrews
        </a>
        .{" "}
        <a
          className="font-medium transition duration-200 hover:text-amber-500"
          href="https://github.com/raphaelandrews/fsx"
          rel="noreferrer"
          target="_blank"
        >
          Source code
        </a>
        .
      </div>
    </footer>
  );
}
