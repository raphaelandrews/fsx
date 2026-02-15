import { cn } from "@/lib/utils"
import { DottedSeparator } from "./dotted-separator";
import { DottedX } from "./dotted-x";

export function Footer({ className }: { className?: string }) {
  return (
    <footer className={cn(className)}>
      <DottedSeparator />
      <DottedX>
        <div className="text-balance text-center text-muted-foreground text-sm leading-loose">
          Built by 💿{" "}
          <a
            className="font-medium text-bulbasaur-foreground transition duration-200 hover:text-highlight"
            href="https://andrews.sh/"
            rel="noreferrer"
            target="_blank"
          >
            Andrews
          </a>
          .{" "}
          <a
            className="font-medium transition duration-200 hover:text-highlight"
            href="https://github.com/raphaelandrews/fsx"
            rel="noreferrer"
            target="_blank"
          >
            Source code
          </a>
          .
        </div>
      </DottedX>
    </footer>
  );
}
